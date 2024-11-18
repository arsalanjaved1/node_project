const Joi = require('joi');

const loginRequestSchema = Joi.object({

    email: Joi.string()
              .email()
              .required(),

    password: Joi.string()
                 .min(8)
                 .max(15)
                 .required(),

    device_type: Joi.string()
                    .required(),
    device_token: Joi.string()
                    .required()

});

const refreshAccessTokenRequest = Joi.object({
    
    refresh_token: Joi.string().required()
    
});

const forgotPasswordRequestSchema = Joi.object({

    email: Joi.string()
              .email()
              .required()

});

const resetForgotPasswordRequestSchema = Joi.object({

    email: Joi.string()
              .email()
              .required(),

    forgot_pwd_token: Joi.string()
                        .length(36)
                        .required(),
    
    new_password: Joi.string()
                    .min(8)
                    .max(15)
                    .required()

});

const resetPasswordRequestSchema = Joi.object({

    email: Joi.string()
              .email()
              .required(),

    old_password: Joi.string()
                    .min(8)
                    .max(15)
                    .required(),
    
    new_password: Joi.string()
                    .min(8)
                    .max(15)
                    .required()

}); 

const exchangeGoogleIdTokenSchema = Joi.object({
    token: Joi.string().required()
})

module.exports = {
    loginRequestSchema,
    refreshAccessTokenRequest,
    forgotPasswordRequestSchema,
    resetPasswordRequestSchema,
    resetForgotPasswordRequestSchema,
    exchangeGoogleIdTokenSchema
}

