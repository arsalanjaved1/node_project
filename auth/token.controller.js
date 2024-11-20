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
router.post('/forgotpwd/reset', _isUserAuthenticated, setNewPasswordAfterForgetting);

module.exports = router; 

async function createAccessTokenPair(req, res) {
    const { error, value } = tokenSchemas.loginRequestSchema.validate(req.body);
    const { email, password, device_token, device_type } = value;

    if (!error) {
        let result = await tokenService.authenticate(email, password, device_token, device_type);

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

    const { error, value } = tokenSchemas.exchangeGoogleIdTokenSchema.validate(req.body);

    if (!error) {
        let result = await tokenService.authenticateWithGoogle(value.token);

        if (!result.hasOwnProperty("error")) {
            return res.status(200).json(result);
        }

        if (result.error.hasOwnProperty("action_required")) {
            return res.status(409).json(result);
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

async function exchangeFacebookTokenForAccessTokenPair(req, res) {
    throw Error("Method not implemented");    
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
    let result = await tokenService.revokeTokenPair(req.headers.authorization);

    if (!result.hasOwnProperty("error")) {
        return res.status(200).json(result);
    }

    return res.status(400).json(result);
}

async function changeKnownPassword(req, res) {
    const { error, value } = tokenSchemas.resetPasswordRequestSchema.validate(req.body);

    if (error) {
        return res.status(400)
            .json
            (
                {
                    error: error.message
                }
            );
    }

    let result = await tokenService.changePassword(req.auth.user, value);

    if (result.hasOwnProperty("error")) {

        if (result.error.code === '10-10') {
            return res.status(400).json(result);
        }
        else if (result.error.code === '10-08') {
            return res.status(403).json(result);
        }
        
        throw new Error("Something went wrong. Please try again.");
    }

    return res.status(200).json(result);
}

async function requestForgotPasswordToken(req, res) {
    const { error, value } = tokenSchemas.forgotPasswordRequestSchema.validate(req.body);

    if (!error) {
        let result = await tokenService.generateForgotPasswordToken(value.email);

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

async function setNewPasswordAfterForgetting(req, res) {    

    const { error, value } = tokenSchemas.resetForgotPasswordRequestSchema.validate(req.body);

    if (!error) {
        let result = await tokenService.resetForgotPassword(value);

        if (!result.hasOwnProperty("error")) {
            return res.status(200).json(result);
        }

        return res.status(400).json(result);
    }

    return res.status(400).json({ error: error.message });
}

function _isUserAuthenticated(req, res, next) {
    if (req.auth || req.headers.hasOwnProperty('authorization')) {
        return res.status(409).json
            (
                {
                    action_required : "LOGOUT",
                    message : "Please logout to continue with password reset."
                }
            );
    }

    next();
}