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
        return dbTestHelper.initializeDBForRefreshTokens();
    });

    afterAll(() => {
        return dbTestHelper.initializeDBForRefreshTokens();
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
