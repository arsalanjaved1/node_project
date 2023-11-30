const client = require('../helpers/database/mongodb');
const errorHelper = require('../helpers/api-errors');
const db_name = process.env.DB_NAME;

module.exports = {
    findUserByEmail,
    insertRefreshToken,
    deleteRefreshToken,
    refreshTokenExists,
    deleteOldAndInsertNewRefreshToken,
    insertRevokedToken
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

async function insertRefreshToken(userId, refreshToken, queryOptions = {}) {   

    let insertResult = await client.db(db_name)
        .collection('refresh_tokens')
        .insertOne
        (
            {
                user: userId,
                refresh_token: refreshToken,
                t : new Date()
            },
            {
                ... queryOptions
            }
        );
    
    return insertResult.acknowledged;
}

async function deleteRefreshToken(refreshToken, queryOptions = {}) {

    let deleteResult = await client.db(db_name)
        .collection('refresh_tokens')
        .deleteOne
        (
            {
                refresh_token: refreshToken                
            },
            {
                ...queryOptions
            }
        );

    return deleteResult.acknowledged;
}

async function deleteOldAndInsertNewRefreshToken(userId, oldRefreshToken, newRefreshToken) {
    
    let result;
    const transactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
    };

    const session = client.startSession();

    try {
        session.startTransaction(transactionOptions);

        result = await deleteRefreshToken(oldRefreshToken, { session })
            && await insertRefreshToken(userId, newRefreshToken, { session });

        if (result === false) {
            throw new Error("The transaction did not achieve desired results.");
        }   

        await session.commitTransaction();
        result = true;
    }
    catch(err) {
        console.log(err);
        await session.abortTransaction();        
    }
    finally {
        await session.endSession();
    }

    return result;
}

async function refreshTokenExists(refreshToken) {

    let record = await client.db(db_name)
        .collection('refresh_tokens')
        .findOne
        (
            {
                refresh_token: refreshToken
            }
        );
    
    if (!record) {
        return errorHelper.getErrorByCode('10-04');
    }

    return {
        refreshTokenRecord : record
    };
}

async function insertRevokedToken(token) {
    let insertResult = await client.db(db_name)
        .collection('revoked_tokens')
        .insertOne
        (
            {
                _id : token,   
                t : new Date()
            },
            {
                ... queryOptions
            }
        );
    
    return insertResult.acknowledged;
}