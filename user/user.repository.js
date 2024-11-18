require('dotenv')
const client = require("../helpers/database/mongodb");

const db_name = process.env.DB_NAME;

async function createUser(user, queryOptions = {}) {
    let insertResult = await client.db(db_name)
        .collection('users')
        .insertOne
        (
            {
                email: user.email,
                password: user.password,
                t : new Date()
            },
            {
                ... queryOptions
            }
        );
    return insertResult.acknowledged;
}

module.exports = {
    createUser
}