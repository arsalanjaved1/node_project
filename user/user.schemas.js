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

const registerUserRequestSchema = Joi.object({
    
    first_name: Joi.string()
                .min(3).max(30)
                .required(),
                
    last_name: Joi.string()
                .min(3).max(30)
                .required(),

    dob: Joi.date().required(),

    email: Joi.string()
                .email({ minDomainSegments: 2, tlds: { allow: ['abc', 'net'] } })
                .email()
                .min(3).max(30)
                .required(),

    password: Joi.string()
                .min(8).max(15)
                .required(),

    gender: Joi.any()
                .valid('male', 'female')
                .required(),

    area: Joi.string()
                .min(3).max(30)
                .required(),

    lat: Joi.string().required(),
    lng: Joi.string().required(),

    phone_slug: Joi.string().required(),
    phone_code: Joi.string().required(),
    phone_number: Joi.string().required(),

    city_id: Joi.string().required(),
    nationality_id: Joi.string().required(),

    device_type: Joi.string(),
    device_token: Joi.string()
});

module.exports = {
    createUserRequestSchema,
    registerUserRequestSchema
}