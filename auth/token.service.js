const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const tokenRepository = require('./token.repository');
const errorHelper = require('../helpers/api-errors');
const { _generateAccessTokenPair, getJwtTokenFromHeader } = require('../helpers/token-helper');
const {OAuth2Client} = require('google-auth-library');
const googleOAuth2Client = new OAuth2Client();
const client = require('../helpers/database/mongodb');
//const emailHelper = require('../helpers/email');

module.exports = {
    authenticate,
    refreshAccessTokenPair,
    revokeTokenPair,
    generateForgotPasswordToken,
    changePassword,
    resetForgotPassword,
    authenticateWithGoogle
};

async function authenticate(email, password, device_token, device_type) {

    let { user, error } = await tokenRepository.findUserByEmail(email);

    if (error) {
        return { error };
    }

    if (!await bcrypt.compare(password, user.password)) {
        return errorHelper.getErrorByCode('10-02');
    }

    let accessRefreshPair =  _generateAccessTokenPair(user._id);

    // Start a session
    const session = client.startSession();

    try {
        // Start a transaction
        session.startTransaction();

        if (!await tokenRepository.insertRefreshToken(user._id, accessRefreshPair, {session}))
            throw new Error('10-03');
        
        if (!await tokenRepository.insertAndUpdateDeviceToken(user._id, device_token, device_type, {session}))
            throw new Error('10-15');

        await session.commitTransaction();
        return accessRefreshPair;
    }
    catch(err) {
        await session.abortTransaction();
        return err.message.includes('10-') 
                    ? errorHelper.getErrorByCode(err.message) 
                    : errorHelper.getErrorByCode('10-1000');
    }
    finally {
        await session.endSession();
    }
}

async function refreshAccessTokenPair(refreshToken) {

    let { error, refreshTokenRecord } = await tokenRepository.refreshTokenExists(refreshToken);
    
    if (error) {
        return { error };
    }

    let accessRefreshPair =  _generateAccessTokenPair(refreshTokenRecord.user);
    
    if (! await tokenRepository.deleteOldAndInsertNewRefreshToken(refreshTokenRecord.user, refreshToken, accessRefreshPair)) {
        return errorHelper.getErrorByCode('10-03');
    }

    return accessRefreshPair;
}

async function revokeTokenPair(jwtTokenHeader) {

    let jwtToken = getJwtTokenFromHeader(jwtTokenHeader);    
    let result = await tokenRepository.insertRevokedTokenAndDeleteOldRefreshToken(jwtToken);

    if (!result) {
        return errorHelper.getErrorByCode('10-05');
    }

    return {
        message : "You have been logged out."
    }
}

async function generateForgotPasswordToken(email) {

    let { error } = await tokenRepository.findUserByEmail(email);

    if (error) {
        return { error };
    }

    let forgotPwdToken = uuidv4();
    let tokenHash = await bcrypt.hash(forgotPwdToken, await bcrypt.genSalt(10));

    let recorded = await tokenRepository.upsertForgotPwdToken(email, tokenHash);

    if (!recorded) {
        return errorHelper.getErrorByCode('10-06');
    }

    //TODO: FIX IT
    console.log(`Forgot password token for ${email} => ${forgotPwdToken}`);

    return {
        message : "Password reset instructions have been sent to your registered email address."
    }
}

async function changePassword(currentUser, changePasswordPayload) {
    let { error, user } = await tokenRepository.findUserById(currentUser);

    if (error) {
        return { error };
    }

    if (user.email !== changePasswordPayload.email) {
        return errorHelper.getErrorByCode('10-08');
    }

    if (!await bcrypt.compare(changePasswordPayload.old_password, user.password)) {
        return errorHelper.getErrorByCode('10-02');
    }

    if (await bcrypt.compare(changePasswordPayload.new_password, user.password)) {
        return errorHelper.getErrorByCode('10-10');
    }

    let newPasswordHash = await bcrypt.hash(changePasswordPayload.new_password, await bcrypt.genSalt(10));
    let recorded = await tokenRepository.updateUserPassword(user._id, newPasswordHash);

    if (!recorded) {
        return errorHelper.getErrorByCode('10-09');
    }

    return {
        message : "Your password has been changed successfully."
    }
}

async function resetForgotPassword({email, forgot_pwd_token, new_password}) {
    let { error, user } = await tokenRepository.findUserByEmail(email);

    if (error) {
        return { error };
    }

    let { error:forgotPwdError , record } = await tokenRepository.findForgotPwdRequestByEmail(email);
    
    if (forgotPwdError) {
        return {
            error : forgotPwdError
        };
    }

    if (!await bcrypt.compare(forgot_pwd_token, record.token)) {
        return errorHelper.getErrorByCode('10-12');
    }

    let newPasswordHash = await bcrypt.hash(new_password, await bcrypt.genSalt(10));
    let recorded = await tokenRepository.updatePasswordAndDeleteForgotPwdRequest(user._id, newPasswordHash, record._id);

    if (!recorded) {
        return errorHelper.getErrorByCode('10-09');
    }

    return {
        message : "Your password has been reset successfully."
    }
}

async function authenticateWithGoogle(IdToken) {

    let tokenPayload = await verifyGoogleIdToken(IdToken);    

    if(!tokenPayload) {
        return errorHelper.getErrorByCode('10-13');
    }

    let { user, error } = await tokenRepository.findUserByEmail(tokenPayload.email);

    if (error) {
        return {
            error: {
                action_required: "REGISTER",
                message: "Please register to be able to login with your google credentials."
            }
        }
    }

    let accessRefreshPair =  _generateAccessTokenPair(user._id);

    if (!await tokenRepository.insertRefreshToken(user._id, accessRefreshPair)) {
        return errorHelper.getErrorByCode('10-03');
    }

    return accessRefreshPair;
}

//TODO: Add multiple CLIENT_ID for multiple apps
//audience: [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
async function verifyGoogleIdToken(IdToken) {
    const ticket = await googleOAuth2Client.verifyIdToken({
        idToken: IdToken,
        audience: process.env.GOOGLE_AUTH_CLIENT_ID
    });

    return ticket.getPayload();
}  

