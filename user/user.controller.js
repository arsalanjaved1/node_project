const express = require('express');
const router = express.Router();
const userSchemas = require('./user.schemas');
const userService = require('./user.service');

// routes
router.post('/create', createUser);
router.post('/register', registerUser);


module.exports = router;

async function createUser(req, res){
    const { error, value } = userSchemas.createUserRequestSchema.validate(req.body);

    if (!error) {
        let result = await userService.createUser(value.email, value.password);

        if (result.hasOwnProperty("error")) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    }

    return res.status(400).json({ error: error.message });
}

async function registerUser(req, res){
    const { error, value } = userSchemas.registerUserRequestSchema.validate(req.body);

    if (!error) {
        let result = await userService.registerUser(value);

        if (result.hasOwnProperty("error")) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    }

    return res.status(400).json({ error: error.message });
}