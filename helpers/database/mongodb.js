const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URL);

module.exports = client;