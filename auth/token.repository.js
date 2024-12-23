const client = require('../helpers/database/mongodb');
const errorHelper = require('../helpers/api-errors');
const { ObjectId } = require('mongodb');
const db_name = process.env.DB_NAME;

module.exports = {
    findUserByEmail,
    findUserById,
    insertRefreshToken,
    deleteRefreshToken,
    refreshTokenExists,
    deleteOldAndInsertNewRefreshToken,
    insertRevokedToken,
    insertRevokedTokenAndDeleteOldRefreshToken,
    upsertForgotPwdToken,
    updateUserPassword,
    findForgotPwdRequestByEmail,
    deleteForgotPwdRequest,
    updatePasswordAndDeleteForgotPwdRequest,
    insertAndUpdateDeviceToken
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

async function findUserById(userId) {

    let user = await client.db(db_name)
        .collection('users')
        .findOne
        (
            {
                _id: new ObjectId(userId)
            }
        );
    
    if (!user) {
        return errorHelper.getErrorByCode('10-07');
    }

    return {
        user : user
    };
}

async function insertRefreshToken(userId, accessRefreshPair, queryOptions = {}) {   

    let insertResult = await client.db(db_name)
        .collection('refresh_tokens')
        .insertOne
        (
            {
                user: userId,
                access_token: accessRefreshPair.access_token,
                refresh_token: accessRefreshPair.refresh_token,
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

async function deleteRefreshTokenByJwt(jwtToken, queryOptions = {}) {

    let deleteResult = await client.db(db_name)
        .collection('refresh_tokens')
        .deleteOne
        (
            {
                access_token: jwtToken
            },
            {
                ...queryOptions
            }
        );

    return deleteResult.acknowledged;
}

async function deleteOldAndInsertNewRefreshToken(userId, oldRefreshToken, accessRefreshPair) {
    
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
            && await insertRefreshToken(userId, accessRefreshPair, { session });

        if (result === false) {
            throw new Error("The transaction did not achieve desired results.");
        }   

        await session.commitTransaction();
        result = true;
    }
    catch(err) {
        result = false;
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

async function insertRevokedToken(token, queryOptions = {}) {
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

async function insertRevokedTokenAndDeleteOldRefreshToken(jwtToken) {

    let result;
    const transactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
    };

    const session = client.startSession();

    try {
        session.startTransaction(transactionOptions);

        result = await insertRevokedToken(jwtToken, { session })
            && await deleteRefreshTokenByJwt(jwtToken, { session });

        if (result === false) {
            throw new Error("The transaction did not achieve desired results.");
        }   

        await session.commitTransaction();
        result = true;
    }
    catch (err) {
        result = false;
        console.log(err);        
        await session.abortTransaction();
    }
    finally {
        await session.endSession();
    }

    return result;
}

async function upsertForgotPwdToken(email, tokenHash) {
    let result = await client.db(db_name).collection('forgotpwd').updateOne(
        {
            email: email
        },
        {
            $set: {
                token: tokenHash,
                t : new Date()
            }
        },
        {
            upsert: true
        }
    );

    return result.acknowledged;
}

async function updateUserPassword(userId, newPasswordHash, queryOptions = {}) {
    let result = await client.db(db_name).collection('users').updateOne(
        {
            _id : userId
        },
        {
            $set: {
                password : newPasswordHash                
            }
        },
        {
            ... queryOptions
        }
    );

    return result.acknowledged;
}

async function findForgotPwdRequestByEmail(email) {
    let record = await client.db(db_name)
        .collection('forgotpwd')
        .findOne
        (
            {
                email: email
            }
        );
    
    if (!record) {
        return errorHelper.getErrorByCode('10-11');
    }

    return {
        record : record
    };
}

async function deleteForgotPwdRequest(recordId, queryOptions = {}) {
    let deleteResult = await client.db(db_name)
        .collection('forgotpwd')
        .deleteOne
        (
            {
                _id: recordId
            },
            {
                ...queryOptions
            }
        );

    return deleteResult.acknowledged;
}

async function updatePasswordAndDeleteForgotPwdRequest(userId, newPasswordHash, forgotPwdRequestId) {
    
    let result;
    const transactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary'
    };

    const session = client.startSession();

    try {
        session.startTransaction(transactionOptions);

        result = await updateUserPassword(userId, newPasswordHash, { session })
            && await deleteForgotPwdRequest(forgotPwdRequestId, { session });

        if (result === false) {
            throw new Error("The transaction did not achieve desired results.");
        }   

        await session.commitTransaction();
        result = true;
    }
    catch(err) {
        result = false;
        console.log(err);
        await session.abortTransaction();                
    }
    finally {
        await session.endSession();
    }

    return result;
}

async function insertAndUpdateDeviceToken(userId, device_token, device_type, queryOptions = {}) {
    let result = await client.db(db_name)
        .collection('device_tokens').updateOne(
            {
                device_token: device_token
            },
            {
                $set: {
                    user: userId,
                    device_token: device_token,
                    device_type: device_type,
                    logged_in: true,
                    t: new Date()
                }
            },
            {
                upsert: true,
                ...queryOptions
            }
        );

    return result.acknowledged;
}