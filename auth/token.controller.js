const express = require('express');
const router = express.Router();
const tokenService = require('./token.service');
const tokenSchemas = require('./token.schemas');

// routes

router.post('/token', createAccessTokenPair);
router.post('/token/exchange/google', exchangeGoogleIdTokenForAccessTokenPair);
router.post('/token/exchange/facebook', exchangeFacebookTokenForAccessTokenPair);
router.post('/token/refresh', refreshAccessTokenPair);
router.post('/token/revoke', revokeAccessTokenPair);
router.put('/password', changeKnownPassword);
router.post('/forgotpwd', requestForgotPasswordToken);
router.post('/forgotpwd/reset', setNewPasswordAfterForgetting);

module.exports = router; 

async function createAccessTokenPair(req, res) {
    const { error, value } = tokenSchemas.loginRequestSchema.validate(req.body);

    if (!error) {
        let result = await tokenService.authenticate(value.email, value.password);

        if (result.hasOwnProperty("error")) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    }

    return res.status(400)
        .json
        (
            {
                error: error.message
            }
        );
}

async function exchangeGoogleIdTokenForAccessTokenPair(req, res) {
    throw Error("Method not implemented");
    next();
}

async function exchangeFacebookTokenForAccessTokenPair(req, res) {
    throw Error("Method not implemented");
    next();
}

async function refreshAccessTokenPair(req, res) {
    const { error, value } = tokenSchemas.refreshAccessTokenRequest.validate(req.body);

    if (!error) {
        let result = await tokenService.refreshAccessTokenPair(value.refresh_token);

        if (!result.hasOwnProperty("error")) {
            return res.status(200).json(result);            
        }

        return res.status(400).json(result);        
    }

    return res.status(400)
        .json
        (
            {
                error: error.message
            }
        );
}

async function revokeAccessTokenPair(req, res) {
    throw Error("Method not implemented");
    next();
}

async function changeKnownPassword(req, res) {
    throw Error("Method not implemented");
    next();
}

async function requestForgotPasswordToken(req, res) {
    throw Error("Method not implemented");
    next();
}

async function setNewPasswordAfterForgetting(req, res) {
    throw Error("Method not implemented");
    next();
}