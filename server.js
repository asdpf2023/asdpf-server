const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
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

    // Store initial payment data in the database
    const payment = {
      ...req.body,
      inputAmount,
      status: "pending",
      createdAt: new Date(),
    };
    const insertedPayment = await paymentsCollection.insertOne(payment);

    // Prepare form data for external API
    let data = new FormData();
    data.append("userName", username);
    data.append("password", password);
    data.append("amount", inputAmount * 100);
    if (req.body.programName) {
      data.append("description", req.body.programName);
    }
    const orderNumber = "G" + +new Date();
    data.append("orderNumber", orderNumber);
    data.append("returnUrl", "https://asdfund.com/successpage/");
    jsonParams = { FORCE_3DS2: "true" };

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

    // Update payment record with external API response
    await paymentsCollection.updateOne(
      { _id: insertedPayment.insertedId },
      {
        $set: {
          apiResponse: response.data,
          orderNumber,
          status: response.data.errorCode ? "failed" : "pending",
        },
      }
    );

    res.status(201).send(response.data);
  } catch (error) {
    res.status(500).send({ message: "Error saving payment data", error });
  }
});

// Endpoint to check the status of an order
app.get("/api/payment/status/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Prepare form data for checking order status
    let data = new FormData();
    data.append("userName", username);
    data.append("password", password);
    data.append("orderNumber", orderNumber);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://ipay.arca.am/payment/rest/getOrderStatusExtended.do",
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    // Make the axios request to external API
    const statusResponse = await axios.request(config);

    // Update payment record with order status
    await paymentsCollection.updateOne(
      { orderNumber: orderNumber },
      {
        $set: {
          statusResponse: statusResponse.data,
          status:
            statusResponse.data.orderStatus === 2 ? "completed" : "failed",
        },
      }
    );

    res.status(200).send(statusResponse.data);
  } catch (error) {
    res.status(500).send({ message: "Error fetching order status", error });
  }
});

// Get donation summary
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
