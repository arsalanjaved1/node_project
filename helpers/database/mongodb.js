const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

client.connect()
    .then((result) => {
        console.log(result);
        console.log(`MongoDB is connected to the server`);
    })
    .catch((err) => {
        console.error(err)
    });

module.exports = client;