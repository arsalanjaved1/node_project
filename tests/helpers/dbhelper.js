const { ObjectId } = require('mongodb');
const client = require('../../helpers/database/mongodb');
const db_name = process.env.DB_NAME;

module.exports = {
    initializeDBForRefreshTokens,
    initializeDBForRevokedTokens,
    insertRefreshTokenRecord,
    deleteRefreshTokenRecordById
};

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
                _id: ObjectId(recordId)
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