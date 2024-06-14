// config.js
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.MONGO_URL,
  dbName: process.env.DBNAME,
  username: process.env.USER_NAME,
  password: process.env.PASSWORD,
};
