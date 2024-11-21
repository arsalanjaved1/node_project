const client = require("../helpers/database/mongodb");
const bcrypt = require('bcrypt');
const { calculateAge } = require('../helpers/common');

const db_name = process.env.DB_NAME;
const collection_name = 'users';
const collection = client.db(db_name).collection(collection_name);


async function findUserByEmail(email) {

    let user = await collection
        .findOne
        (
            {
                email: email
            }
        );
    return user;
}

async function createUser(user, queryOptions = {}) {

    if(user.dob)
        user.age = await calculateAge(user.dob);

    if(user.lat && user.lng)
        user.location = { coordinates: [user.lng, user.lat], type: 'point' };

    user.phone = null;
    if(user.phone_slug)
        user.phone = { ...user.phone, slug: user.phone_slug}
    if(user.phone_code)
        user.phone = { ...user.phone, code: user.phone_code}
    if(user.phone_number)
        user.phone = { ...user.phone, number: user.phone_number}

    delete user.lat
    delete user.lng
    delete user.phone_slug
    delete user.phone_code
    delete user.phone_number

    let insertResult = await collection
        .insertOne
        (
            {
                ...user,
                t: new Date()
            },
            {
                ... queryOptions
            }
        );
    return insertResult.acknowledged;
}

async function updateUser(userId, user, queryOptions = {}) {

    if(user.dob)
        user.age = await calculateAge(user.dob);

    if(user.lat && user.lng)
        user.location = { coordinates: [user.lng, user.lat], type: 'point' };

    delete user.lat
    delete user.lng

    let updateResult = await collection
        .updateOne
        (
            { _id: userId },
            {
                ...user,
                t: new Date()
            },
            {
                ... queryOptions
            }
        );
    return updateResult.acknowledged;
}

async function encryptPassword(password) {
    return await bcrypt.hash(password, await bcrypt.genSalt(10));
}

module.exports = {
    findUserByEmail,
    encryptPassword,
    createUser,
    updateUser
}