require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.PORT;
const errorHandler = require('./helpers/error-handler');
const jwtAuthenticate = require('./helpers/jwt-authentication');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

app.use('/docs', require('./docs/docs.js'));

// use JWT auth to secure the api
app.use(jwtAuthenticate());

app.use('/auth', require('./auth/token.controller'));

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
app.listen(port, () => console.log(`NODEAUTH listening on port ${port}!`));

module.exports = app;