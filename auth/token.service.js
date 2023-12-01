const client = require('../helpers/database/mongodb');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const tokenRepository = require('./token.repository');
const errorHelper = require('../helpers/api-errors');
//const emailHelper = require('../helpers/email');

module.exports = {
    authenticate,
    refreshAccessTokenPair,
    revokeTokenPair
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

function getJwtTokenFromHeader(authHeader) {
    return authHeader.split(" ")[1];
}

//TODO: FIX TTL
function _generateAccessTokenPair(userId) {    

    const accessToken = _generateJWTToken(userId);
    const refreshToken = _generateRefreshToken();

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        ttl: 3600
    };
}

function _generateRefreshToken() {
    return uuidv4();
}

function _generateJWTToken(userId) {
    return jwt.sign(
        {
            user: userId
        },
        process.env.JWT_SECRET
    );
}

