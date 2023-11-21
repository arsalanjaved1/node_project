const client = require('../helpers/database/mongodb');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const tokenRepository = require('./token.repository');
const errorHelper = require('../helpers/api-errors');
//const emailHelper = require('../helpers/email');

module.exports = {
    authenticate
};

async function authenticate(email, password) {

    let { user, error } = await tokenRepository.findUserByEmail(email);

    if (error) {
        return { error };
    }

    if (!await bcrypt.compare(password, user.password)) {
        return errorHelper.getErrorByCode('10-02');
    }

    let accessRefreshPair =  _generateAccessTokenPair(user);

    if (!await tokenRepository.insertRefreshToken(email, accessRefreshPair.refresh_token)) {
        return errorHelper.getErrorByCode('10-03');
    }

    return accessRefreshPair;
}

//TODO: FIX TTL
function _generateAccessTokenPair(user) {
    let { password, ...userWithoutPassword } = user;

    const accessToken = _generateJWTToken(userWithoutPassword);
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

function _generateJWTToken(userWithoutPassword) {
    return jwt.sign(
        {
            user: userWithoutPassword._id
        },
        process.env.JWT_SECRET
    );
}

