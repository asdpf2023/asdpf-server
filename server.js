const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const axios = require("axios");
const FormData = require("form-data");
const { port, databaseUrl, username, password, dbName } = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

let db, paymentsCollection;

// Connect to MongoDB
MongoClient.connect(databaseUrl)
  .then((client) => {
    console.log("MongoDB Connected");
    db = client.db(dbName);
    paymentsCollection = db.collection("september");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Payment endpoint
app.post("/api/payment", async (req, res) => {
  try {
    // Convert inputAmount to a number
    const inputAmount = Number(req.body.inputAmount);

    // Check if inputAmount is a valid number
    if (isNaN(inputAmount)) {
      return res.status(400).send({ message: "inputAmount must be a number" });
    }

    // Store payment data in the database
    const payment = { ...req.body, inputAmount }; // Include other payment data as needed
    await paymentsCollection.insertOne(payment);

    // Prepare form data for external API
    let data = new FormData();
    data.append("userName", username);
    data.append("password", password);
    data.append("amount", inputAmount * 100);
    // Add program description if available
    if (req.body.programName) {
      data.append("description", req.body.programName);
    }
    data.append("orderNumber", "G" + +new Date());
    data.append("returnUrl", "https://asdfund.com/successpage/");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://ipay.arca.am/payment/rest/register.do",
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

app.get("/api/donations/:programId", async (req, res) => {
  try {
    const total = await paymentsCollection
      .aggregate([
        { $match: { programId: req.params.programId } },
        {
          $group: { _id: "$programId", inputAmount: { $sum: "$inputAmount" } },
        },
      ])
      .toArray();
    res.status(200).send(total);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving donation data", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
