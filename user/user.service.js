const userRepository = require('./user.repository');
const errorHelper = require('../helpers/api-errors');
const bcrypt = require('bcrypt');

async function createUser(email, password) {

    password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    let result = await userRepository.createUser({ email, password });

    if (!result) {
        return errorHelper.getErrorByCode('10-14');
    }

    return {
        email
    };
}

async function registerUser(user) {

    let existedUser = await userRepository.findUserByEmail(user.email);
    if (existedUser)
        return errorHelper.getErrorByCode('10-16');

    user.password = await userRepository.encryptPassword(user.password);
    let result = await userRepository.createUser(user);

    if (!result)
        return errorHelper.getErrorByCode('10-14');

    return {
        result
    };
}

module.exports = {
    createUser,
    registerUser
};