const { expressjwt: jwt } = require('express-jwt');

module.exports = jwtAuthentication;

function jwtAuthentication() {

    return jwt
        (
            {
                secret: process.env.JWT_SECRET,
                algorithms: ["HS256"]
            }
        )
        .unless
        (
            {
                path:
                    [
                        '/auth/token',
                        '/auth/token/refresh',
                        '/auth/forgotpwd',
                        '/auth/forgotpwd/link',
                        '/auth/forgotpwd/email',
                        '/auth/forgotpwd/reset'
                    ]
            }
        );
}
