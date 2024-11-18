const userRepository = require('./user.repository');
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

module.exports = {
    createUser
};