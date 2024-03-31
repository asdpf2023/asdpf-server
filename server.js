// const express = require("express");
// const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const { port, database } = require("./config");
const axios = require("axios");
const FormData = require("form-data");
const app = express();

// Connect to MongoDB

// Connect to MongoDB
mongoose
  .connect(database)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create a schema for the payment data
const PaymentSchema = new mongoose.Schema({
  programId: String,
  programName: String,
  amount: Number,
  cardDetails: {
    cardNumber: String,
    cardholderName: String,
    expiryMonth: String,
    expiryYear: String,
    cvv: String,
  },
});
const Payment = mongoose.model("Payment", PaymentSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Payment endpoint
app.post("/api/payment", async (req, res) => {
  let data = new FormData();
  data.append("userName", "asdfund_api");
  data.append("password", "asdfund1234");
  data.append("amount", "1");
  data.append("orderNumber", "G" + +new Date());
  data.append("returnUrl", "http://localhost:8000/api/success");

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://ipaytest.arca.am:8445/payment/rest/register.do",
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };
  const response = await axios.request(config);
  res.send(response.data);
  console.log(response);
});

app.get("/api/success", async (req, res) => {
  console.log("work");
  console.log(req);
  res.send("ok");
});

app.get("/api/donations/:programId", async (req, res) => {
  try {
    const total = await Payment.aggregate([
      { $match: { programId: req.params.programId } },
      { $group: { _id: "$programId", totalAmount: { $sum: "$amount" } } },
    ]);
    res.status(200).send(total);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving donation data", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
