require('dotenv').config();
let tokenRepository = require('../auth/token.repository');
const dbTestHelper = require('./helpers/dbhelper');
const testUtils = require('./helpers/utils');

describe('Token Repository tests', () => {

    beforeEach(() => {
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication unit tests.")
        });
    });

    afterEach(() => {
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication unit tests.")
        });
    });

    it("findUserById() should return an existing user's record from the database", async () => {

        //Arrange
        let userId = await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword").insertedId;
        
        //Act
        let userRecord = await tokenRepository.findUserById(userId);
        
        //Assert
        expect(userId).toStrictEqual(userRecord._id);

    });


});