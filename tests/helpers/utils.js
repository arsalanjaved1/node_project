let tokenHelper = require('../../helpers/token-helper');

module.exports = {
    getAuthTokenPair
}

async function getAuthTokenPair(userId) {
    return tokenHelper._generateAccessTokenPair(userId);
}