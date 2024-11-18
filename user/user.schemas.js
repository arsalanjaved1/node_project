const Joi = require('joi');

const createUserRequestSchema = Joi.object({
    email: Joi.string()
                .email()
                .required(),

    password: Joi.string()
                .min(8)
                .max(15)
                .required(),

    device_type: Joi.string(),
    device_token: Joi.string()
});

module.exports = {
    createUserRequestSchema
}