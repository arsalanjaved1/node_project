const request = require("supertest");
const app = require("../index");
const dbTestHelper = require('./helpers/dbhelper');
const { ObjectId } = require("mongodb");

describe('Authentication using username and password', () => {

    it('provides access and refresh tokens with expiry against correct credentials.', async () => {

        let data = {
            email: "mohsin.nanosoft@gmail.com",
            password: "hashedPassword"
        };

        const response = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send(data);

        console.log(response.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");
        expect(response.body).toHaveProperty("ttl");

    });

    it('throws error message against incorrect credentials (correct username, incorrect password).', async () => {

        let data = {
            email: "mohsin.nanosoft@gmail.com",
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
        let data = {
            email: "mohsin.nanosoft@gmail.com",
            password: "hashedPassword"
        };

        const accessTokenPairRequest = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send(data);

        console.log(accessTokenPairRequest.body);

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .auth(accessTokenPairRequest.body.access_token, { type: 'bearer' })
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
        let data = {
            email: "mohsin.nanosoft@gmail.com",
            password: "hashedPassword"
        };

        const accessTokenPairRequest = await request(app)
            .post("/auth/token")
            .set("content-type", "application/json")
            .send(data);

        console.log(accessTokenPairRequest.body);

        await dbTestHelper.insertRevokedToken(accessTokenPairRequest.body.access_token);

        //Act
        const response = await request(app)
            .post("/auth/token/revoke")
            .set("content-type", "application/json")
            .auth(accessTokenPairRequest.body.access_token, { type: 'bearer' })
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
        return dbTestHelper.initializeDBForForgotPassword().then(()=> {
            console.log("Forgot Password DB prepared.")
        });
    });

    afterEach(() => {        
        return dbTestHelper.initializeDBForForgotPassword().then(()=> {
            console.log("Forgot Password DB prepared.")
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