const request = require("supertest");
const app = require("../index");
const dbTestHelper = require('./helpers/dbhelper');
const testUtils = require('./helpers/utils');
const { ObjectId } = require("mongodb");

describe('Authentication using username and password', () => {

    beforeEach(() => {
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(()=> {
            console.log("Database prepared for Authentication tokens.")
        });
    });

    afterEach(() => {        
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(()=> {
            console.log("Database prepared for Authentication tokens.")
        });
    });

    it('provides access and refresh tokens with expiry against correct credentials.', async () => {

        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();

        //Act
        const response = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send({
                email : "testuser@abc.com",
                password : "hashedPassword"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");
        expect(response.body).toHaveProperty("ttl");

    });

    it('throws error message against incorrect credentials (correct username, incorrect password).', async () => {

        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();

        //Act
        const response = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send({
                email : "testuser@abc.com",
                password : "hashedPa1230rd"
            });

        console.log(response.body);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
        expect(response.body)
            .toStrictEqual
                (
                    {
                        error : {
                            code : '10-02',
                            message: 'Either the username or the password is incorrect.'
                        }
                    }
                )
    });

    it('throws error message against incorrect credentials (incorrect username).', async () => {

        let data = {
            email: "non.existent.user@gmail.com",
            password: "hashedPa22word"
        };

        const response = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
        expect(response.body)
            .toStrictEqual
                (
                    {
                        error : {
                            code : '10-01',
                            message: 'Either the username or the password is incorrect.'
                        }
                    }
                )
    });   
    
});

describe('Refresh Tokens', () => {

    beforeAll(() => {
        return dbTestHelper.initializeDBForRefreshTokens().then(()=> {
            console.log("Refresh tokens cleared.")
        });
    });

    afterAll(() => {
        return dbTestHelper.initializeDBForRefreshTokens().then(()=> {
            console.log("Refresh tokens cleared.")
        });
    });

    it('throws validation error for wrong data type in refresh_token', async () => {
        
        //Arrange        
        const data = {
            refresh_token : 1234
        };

        //Act
        const response = await request(app)
            .post("/auth/token/refresh")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");        
    });

    it('throws validation error for missing refresh_token', async () => {
        
        //Arrange        
        const data = {
            arefresh_token : 1234
        };

        //Act
        const response = await request(app)
            .post("/auth/token/refresh")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");        
    });

    it('provides new <access_token, refresh_token> pair with expiry against correct <refresh_token>.', async () => {

        //Arrange
        const { v4: uuidv4 } = require('uuid');
        const refresh_token = uuidv4();
        const data = {
            refresh_token : refresh_token
        };

        await dbTestHelper.insertRefreshTokenRecord
            (
                {
                    user: ObjectId.generate(),
                    refresh_token: refresh_token,
                    t : new Date()
                }
            );

        //Act
        const response = await request(app)
            .post("/auth/token/refresh")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");
        expect(response.body).toHaveProperty("ttl");

    });

    it('throws error message 10-04 against a non-existent refresh token', async () => {
        
        //Arrange
        const { v4: uuidv4 } = require('uuid');
        const refresh_token = uuidv4();
        const data = {
            refresh_token : refresh_token
        };

        //Act
        const response = await request(app)
            .post("/auth/token/refresh")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
        expect(response.body)
            .toStrictEqual
                (
                    {
                        error : {
                            code : '10-04',
                            message: 'Please re-authenticate.'
                        }
                    }
                )
    });
});

describe('Revoked Tokens', () => {

    beforeEach(() => {
        return Promise.all(dbTestHelper.initializeDBForRevokedTokens()).then(()=> {
            console.log("Revoked tokens DB prepared.")
        });
    });

    afterEach(() => {        
        return Promise.all(dbTestHelper.initializeDBForRevokedTokens()).then(()=> {
            console.log("Revoked tokens DB cleaned.")
        });
    });

    it('Successfully marks a valid access_token as revoked.', async () => {
        
        //Arrange        
        let userId = (await dbTestHelper.insertUser("testuser2@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userId);

        console.log(authTokenPair);

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send();

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message : "You have been logged out."
                }
            );     
    });

    it('Errors out a revoke token request without authentication', async () => {

        //Arrange             

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .send();

        console.log(response.body);

        //Assert
        expect(response.status).toBe(401);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message: "No authorization token was found"
                }
            );              

    });

    it('Errors out on bogus/invalid/expired token', async () => {

        //Arrange             

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .auth("bogustokencompk", { type: 'bearer' })
            .send();

        console.log(response.body);

        //Assert
        expect(response.status).toBe(401);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message: "Invalid Token"
                }
            );              

    });

    it('Errors out while revoking an already revoked token', async () => {
        
        //Arrange        
        let userId = (await dbTestHelper.insertUser("testuser2@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userId);

        console.log(authTokenPair);        

        await dbTestHelper.insertRevokedToken(authTokenPair.access_token);

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send();

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
        expect(response.body)
            .toStrictEqual
            (
                {
                    error: {
                        code: '10-05',
                        message: 'Could not log out. Please try again.'
                    }
                }
            );
    });

});

describe('Forgot Password', () => {

    beforeEach(() => {
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication tests.")
        });
    });

    afterEach(() => {        
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication tests.")
        });
    });


    it('throws validation error for a missing email field in the body', async () => {
        //Arrange        

        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                wrong_field : "abc@123.com"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    it('throws validation error for a malformed email field in the body', async () => {
        //Arrange        

        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                email : "abc^>_123.com"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    it('Should error out when requested by an unregistered user.', async () => {
        //Arrange        

        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                email : "abc@123.com"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    it.todo('Should let a user with unverified email to be able to request forgot password.');
    it.todo('Should let a user with verified email to be able to request forgot password.');

    it('Should let a registered user request forgot password.', async () => {
        //Arrange        
        await dbTestHelper.insertUser("mohsin.nanosoft@gmail.com", "hashedPassword");
        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                email : "mohsin.nanosoft@gmail.com"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message : "Password reset instructions have been sent to your registered email address."
                }
            );
    });

    it('Should let a user re-request forgot password.', async () => {
        //Arrange        
        let userOneId = (await dbTestHelper.insertUser("mohsin.nanosoft@gmail.com", "hashedPassword")).insertedId.toHexString();
        
        await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")
            .send({
                email: "mohsin.nanosoft@gmail.com"
            });

        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                email : "mohsin.nanosoft@gmail.com"
            });

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message : "Password reset instructions have been sent to your registered email address."
                }
            );
    });

    it('Should replace the old forgot password request with a new one.', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("mohsin.nanosoft@gmail.com", "hashedPassword")).insertedId.toHexString();        
                
        await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")
            .send({
                email: "mohsin.nanosoft@gmail.com"
            });

        let oldRequest = await dbTestHelper.findForgotPwdRecordByEmail("mohsin.nanosoft@gmail.com");
        console.log(oldRequest);

        //Act
        const response = await request(app)
            .post("/auth/forgotpwd")
            .set("content-type", "application/json")            
            .send({
                email : "mohsin.nanosoft@gmail.com"
            });

        console.log(response.body);
        
        let newRequest = await dbTestHelper.findForgotPwdRecordByEmail("mohsin.nanosoft@gmail.com");
        console.log(newRequest);
        //Assert
        expect(response.status).toBe(200);
        expect(oldRequest).not.toEqual(newRequest);
    });
});

describe('Change Known Password', () => {
    
    beforeEach(() => {
        return dbTestHelper.initializeDBForChangePassword().then(() => {
            console.log("Change Password DB prepared.")
        });
    });

    afterEach(() => {
        return dbTestHelper.initializeDBForChangePassword().then(() => {
            console.log("Change Password DB prepared.")
        });
    });

    it.each
        (
            [
                ["email", "old_password", "n_password"],
                ["email", "o_password", "new_password"],
                ["em", "old_password", "new_password"],
            ]
        )
        ('throws validation for invalid request body', async (emailField, oldPasswordField, newPasswordField) => {
            //Arrange
            let userId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
            let authTokenPair = await testUtils.getAuthTokenPair(userId);

            let data = {
                [emailField]: "testuser@abc.com",
                [oldPasswordField]: "hashedPassword",
                [newPasswordField]: "asdbsadjkhdjka"
            }

            //Act
            const response = await request(app)
                .put("/auth/password")
                .set("content-type", "application/json")
                .auth(authTokenPair.access_token, { type: 'bearer' })
                .send(data);

            console.log(response.body);

            //Assert
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
    });

    it('should not let a user change password of another user', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        let userTwoId = (await dbTestHelper.insertUser("testuser2@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userOneId);

        let data = {
            email : "testuser2@abc.com",
            old_password : "hashedPassword",
            new_password : "newPasswordacv"
        }

        //Act
        const response = await request(app)
            .put("/auth/password")
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(403);        
        expect(response.body)
            .toStrictEqual
                (
                    {
                        error : {
                            code : '10-08',
                            message: "Incorrect email address."
                        }
                    }
                );
    });

    it('should let a user change their own password given they provide correct existing password', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userOneId);

        let data = {
            email : "testuser@abc.com",
            old_password : "hashedPassword",
            new_password : "newPasswordacv"
        }

        //Act
        const response = await request(app)
            .put("/auth/password")
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);        
        expect(response.body)
            .toStrictEqual
                (
                    {
                        message : "Your password has been changed successfully."
                    }
                );
    });

    it('should not let the user set their current password as the new password', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userOneId);

        let data = {
            email : "testuser@abc.com",
            old_password : "hashedPassword",
            new_password : "hashedPassword"
        }

        //Act
        const response = await request(app)
            .put("/auth/password")
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send(data);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);        
        expect(response.body)
            .toStrictEqual
                (
                    {
                        error : {
                            code : '10-10',
                            message: "Please choose a different password than the new one."
                        }
                    }
                );
    });
});

describe('Forgot password reset', () => {
    //post('/forgotpwd/reset')

    beforeEach(() => {
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication tests.")
        });
    });

    afterEach(() => {        
        return Promise.all(dbTestHelper.clearDatabaseForAuth()).then(() => {
            console.log("Database prepared for Authentication tests.")
        });
    });

    it('should error out when requested by a loggedin user', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        let authTokenPair = await testUtils.getAuthTokenPair(userOneId);
        await dbTestHelper.insertForgotPwdRequest
            (
                {
                    email : "testuser@abc.com",
                    token : "1234-5678-1234-2312"
                }
            );
        
        let resetForgotPwdPayload = {
            email : "testuser@abc.com",
            forgot_pwd_token : "1234-5678-1234-2312",
            new_password : "hashedPassw0rd"
        };

        //Act
        const response = await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")
            .auth(authTokenPair.access_token, { type: 'bearer' })
            .send(resetForgotPwdPayload);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(409);
        expect(response.body)
            .toStrictEqual
            (
                {
                    action_required : "LOGOUT",
                    message : "Please logout to continue with password reset."
                }
            );
    });

    it('should let a registered user reset a forgotten password', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        
        await dbTestHelper.insertForgotPwdRequest
            (
                {
                    email : "testuser@abc.com",
                    token : "1234-5678-1234-2312-2312-2312-231212"
                }
            );
        
        let resetForgotPwdPayload = {
            email : "testuser@abc.com",
            forgot_pwd_token : "1234-5678-1234-2312-2312-2312-231212",
            new_password : "hashedPassw0rd"
        };

        //Act
        const response = await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")            
            .send(resetForgotPwdPayload);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(200);
        expect(response.body)
            .toStrictEqual
            (
                {
                    message : "Your password has been reset successfully."
                }
            );
    });

    it('should not let an unregistered user reset a forgotten password', async () => {
        //Arrange        
        let resetForgotPwdPayload = {
            email : "testuser@abc.com",
            forgot_pwd_token : "1234-5678-1234-2312-2312-2312-231212",
            new_password : "hashedPassw0rd"
        };

        //Act
        const response = await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")            
            .send(resetForgotPwdPayload);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body)
            .toStrictEqual
            (
                {
                    error : {
                        code : '10-01',
                        message : 'Either the username or the password is incorrect.'
                    }
                }
            );
    });
    
    it('should not let a user reset a forgotten password of any other user', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();
        let userTwoId = (await dbTestHelper.insertUser("testuser2@abc.com", "hashedPassword")).insertedId.toHexString();
        
        await dbTestHelper.insertForgotPwdRequest
            (
                {
                    email : "testuser@abc.com",
                    token : "1234-5678-1234-2312-2312-2312-231212"
                }
            );
        
        let resetForgotPwdPayload = {
            email : "testuser2@abc.com",
            forgot_pwd_token : "1234-5678-1234-2312-2312-2312-231212",
            new_password : "hashedPassw0rd"
        };

        //Act
        const response = await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")            
            .send(resetForgotPwdPayload);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body)
            .toStrictEqual
            (
                {
                    error: {
                        code: '10-11',
                        message: 'Either the token has expired or it does not exist.'
                    }
                }
            );
    });

    it('should not let a user reset a forgotten password using an already used forgot password token', async () => {
        //Arrange
        let userOneId = (await dbTestHelper.insertUser("testuser@abc.com", "hashedPassword")).insertedId.toHexString();        
        
        await dbTestHelper.insertForgotPwdRequest
            (
                {
                    email : "testuser@abc.com",
                    token : "1234-5678-1234-2312-2312-2312-231212"
                }
            );
        
        let resetForgotPwdPayload = {
            email : "testuser@abc.com",
            forgot_pwd_token : "1234-5678-1234-2312-2312-2312-231212",
            new_password : "hashedPassw0rd"
        };

        await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")            
            .send(resetForgotPwdPayload);

        //Act
        const response = await request(app)
            .post('/auth/forgotpwd/reset')
            .set("content-type", "application/json")            
            .send(resetForgotPwdPayload);

        console.log(response.body);

        //Assert
        expect(response.status).toBe(400);
        expect(response.body)
            .toStrictEqual
            (
                {
                    error: {
                        code: '10-11',
                        message: 'Either the token has expired or it does not exist.'
                    }
                }
            );
    });
});