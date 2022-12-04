const mongoose = require("mongoose");
require("dotenv").config();

// const MONGO_URL = process.env.MONGO_URL
const MONGO_URL = `mongodb://localhost:27017/artimisdb`;

mongoose.connection.once("open", () => {
  console.log("Mongodb connection ready");
});

mongoose.connection.on("error", (error) => {
  console.error(error);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = { mongoConnect, mongoDisconnect };
