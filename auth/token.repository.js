const client = require('../helpers/database/mongodb');
const errorHelper = require('../helpers/api-errors');
const db_name = process.env.DB_NAME;

module.exports = {
    findUserByEmail
}

async function findUserByEmail(email) {

    let user = await client.db(db_name)
        .collection('users')
        .findOne
        (
            {
                email: email
            }
        );
    
    if (!user) {
        return errorHelper.getErrorByCode('10-01');
    }

    return {
        user : user
    };
}