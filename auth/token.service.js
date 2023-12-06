const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const tokenRepository = require('./token.repository');
const errorHelper = require('../helpers/api-errors');
const { _generateAccessTokenPair, getJwtTokenFromHeader } = require('../helpers/token-helper');
//const emailHelper = require('../helpers/email');

module.exports = {
    authenticate,
    refreshAccessTokenPair,
    revokeTokenPair,
    generateForgotPasswordToken,
    changePassword,
    resetForgotPassword
};

async function authenticate(email, password) {

    let { user, error } = await tokenRepository.findUserByEmail(email);

    if (error) {
        return { error };
    }

    if (!await bcrypt.compare(password, user.password)) {
        return errorHelper.getErrorByCode('10-02');
    }

    let accessRefreshPair =  _generateAccessTokenPair(user._id);

    if (!await tokenRepository.insertRefreshToken(user._id, accessRefreshPair)) {
        return errorHelper.getErrorByCode('10-03');
    }

    return accessRefreshPair;
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



