const { ObjectId } = require('mongodb');
const client = require('../../helpers/database/mongodb');
const bcrypt = require('bcrypt');
const db_name = process.env.DB_NAME;

module.exports = {
    initializeDBForRefreshTokens,
    initializeDBForRevokedTokens,
    initializeDBForChangePassword,
    insertRefreshTokenRecord,
    deleteRefreshTokenRecordById,
    insertRevokedToken,
    initializeDBForForgotPassword,
    findForgotPwdRecordByEmail,
    insertUser,
    clearUsers,
    clearDatabaseForAuth
};

function clearDatabaseForAuth() {
    return [
        clearUsers(),
        clearRefreshTokens(),
        clearRevokedTokens(),
        initializeDBForForgotPassword()
    ];
}

function initializeDBForRefreshTokens() {
    return client.db(db_name)
        .collection('refresh_tokens')
        .deleteMany({});
}

function initializeDBForRevokedTokens() {
    return [
        clearRefreshTokens(),
        clearRevokedTokens()
    ];
}

function initializeDBForChangePassword() {
    return client.db(db_name)
        .collection('users')
        .deleteMany({});
}

function insertRefreshTokenRecord(record) {
    return client.db(db_name)
        .collection('refresh_tokens')
        .insertOne(record);
}

function deleteRefreshTokenRecordById(recordId) {
    return client.db(db_name)
        .collection('refresh_tokens')
        .deleteOne
        (
            {
                _id: new ObjectId(recordId)
            }
        );
}

function clearRefreshTokens() {
    return client.db(db_name)
        .collection('refresh_tokens')
        .deleteMany({});
}

function clearRevokedTokens() {
    return client.db(db_name)
        .collection('revoked_tokens')
        .deleteMany({});
}

function clearUsers() {
    return client.db(db_name)
        .collection('users')
        .deleteMany({});
}

function insertRevokedToken(token) {
    return client.db(db_name)
        .collection('revoked_tokens')
        .insertOne
        (
            {
                _id: token,
                t: new Date()
            }
        );
}

function initializeDBForForgotPassword() {
    return client.db(db_name)
        .collection('forgotpwd')
        .deleteMany({});
}

function findForgotPwdRecordByEmail(email) {
    return client.db(db_name)
        .collection('forgotpwd')
        .findOne
            (
                {
                    email : email
                }
            );
}

async function insertUser(email, password) {
    return client.db(db_name)
        .collection('users')
        .insertOne
        (
            {
                email: email,
                password : await bcrypt.hash(password, await bcrypt.genSalt(10))
            }
        );
}

