require('dotenv').config();
const client = require('./helpers/database/mongodb.js');
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./helpers/error-handler.js');
const jwtAuthenticate = require('./helpers/jwt-authentication.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

app.use('/docs', require('./docs/docs.js'));

//TODO: This is for testing only. REMOVE BEFORE PROD!!
app.get('/hash', async function (req, res) {
    
    if (req.query.hasOwnProperty('password')) {

        let bcrypt = require('bcrypt');

        return res.status(200)
            .json
            (
                {
                    hash: await bcrypt.hash(req.query.password, await bcrypt.genSalt(10))
                }
            )
    }

    return res.status(400)
        .json
        (
            {
                error: 'Please provide password in query parameter.'
            }
        )
});

app.use('/user', require('./user/user.controller.js'));

// use JWT auth to secure the api
app.use(jwtAuthenticate());

app.use('/auth', require('./auth/token.controller.js'));

// throw 404 if URL not found
app.all("*", function (req, res) {
    console.error(req);

    return res.status(404).json
        (
            {
                error: {
                    code : 404,
                    message : "Resource not found."
                }
            }
        );
});
 
app.use(errorHandler);

module.exports = app;