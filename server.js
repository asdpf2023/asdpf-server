const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const FormData = require("form-data");
const { port, database, username, password } = require("./config");
console.log(username, password);
const app = express();

// Connect to MongoDB
mongoose
  .connect(database)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create a schema for the payment data
const PaymentSchema = new mongoose.Schema({
  programId: String,
  programName: String,
  inputAmount: Number,
  userDetails: {
    name: String,
    email: String,
  },
});
const Payment = mongoose.model("Payment", PaymentSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Payment endpoint
app.post("/api/payment", async (req, res) => {
  try {
    const payment = new Payment(req.body); // req.body should include programId
    await payment.save();

    // Prepare form data for external API
    let data = new FormData();
    data.append("userName", username);
    data.append("password", password);
    data.append("amount", req.body.inputAmount * 100);
    // Add program description if available
    if (req.body.programName) {
      data.append("description", req.body.programName);
    }
    data.append("orderNumber", "G" + +new Date());
    data.append("returnUrl", "https://asdfund.com/successpage/");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://ipaytest.arca.am:8445/payment/rest/register.do",
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    // Make the axios request to external API
    const response = await axios.request(config);
    res.status(201).send(response.data);
    console.log(response);
  } catch (error) {
    res.status(500).send({ message: "Error saving payment data", error });
  }
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
      { $group: { _id: "$programId", inputAmount: { $sum: "$inputAmount" } } },
    ]);
    res.status(200).send(total);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving donation data", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
