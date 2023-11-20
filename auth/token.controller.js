const express = require('express');
const router = express.Router();
const tokenService = require('./token.service');
const tokenSchemas = require('./token.schemas');

// routes

router.post('/token', getNewAccessTokenPairAgainstUsernamePassword);
router.post('/token/exchange/google', exchangeGoogleIdTokenForAccessTokenPair);
router.post('/token/exchange/facebook', exchangeFacebookTokenForAccessTokenPair);
router.post('/token/refresh', refreshAccessTokenPair);
router.post('/token/revoke', revokeAccessTokenPair);
router.put('/password', changeKnownPassword);
router.post('/forgotpwd', requestForgotPasswordToken);
router.post('/forgotpwd/reset', setNewPasswordAfterForgetting);

module.exports = router; 

async function getNewAccessTokenPairAgainstUsernamePassword(req, res, next) {
    const {error, value} = tokenSchemas.loginRequestSchema.validate(req.body);

    if (!error) {
        try {
            var result = await tokenService.authenticate(value.email, value.password);

            if (result.hasOwnProperty("error")) {
                return res.status(400).json(result);
            }
            else {
                return res.json(result);
            }
        }
        catch(e) {
            console.log(e);

            if (err.name === 'MongoError') {
                return res.status(503).json({ 
                    error: 'Service unavailabe. Please try again.' 
                });
            }
        }
    }
    else {
        return res.status(400).json({error: error.message});
    }

    next();
}

async function exchangeGoogleIdTokenForAccessTokenPair(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function exchangeFacebookTokenForAccessTokenPair(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function refreshAccessTokenPair(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function revokeAccessTokenPair(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function changeKnownPassword(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function requestForgotPasswordToken(req, res, next) {
    throw Error("Method not implemented");
    next();
}

async function setNewPasswordAfterForgetting(req, res, next) {
    throw Error("Method not implemented");
    next();
}