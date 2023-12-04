const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

function getJwtTokenFromHeader(authHeader) {
    return authHeader.split(" ")[1];
}
exports.getJwtTokenFromHeader = getJwtTokenFromHeader;
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
exports._generateAccessTokenPair = _generateAccessTokenPair;
function _generateRefreshToken() {
    return uuidv4();
}
//TODO: Add iat and exp
function _generateJWTToken(userId) {
    return jwt.sign(
        {
            user: userId
        },
        process.env.JWT_SECRET
    );
}
