const request = require("supertest");
const app = require("../index");

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

    it('throws error message against incorrect credentials (correcnt username, incorrect password).', async () => {

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

    it('throws error message against incorrect credentials (incorrecnt username).', async () => {

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