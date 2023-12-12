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
                        '/auth/token/exchange/google',
                        '/token/exchange/facebook',
                        '/auth/token/refresh',
                        '/auth/forgotpwd',
                        '/auth/forgotpwd/reset'
                    ]
            }
        );
}
