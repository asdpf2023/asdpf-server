// config.js
const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  port: process.env.PORT || 3000,
  database: process.env.MONGO_URL,
};
