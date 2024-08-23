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
    paymentsCollection = db.collection("payments");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Function to get the order status from the external API and update the database
async function getOrderStatus(orderNumber) {
  try {
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

    // Update payment record with order status in MongoDB
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

    // Log the status response to the console
    console.log(statusResponse.data);

    return statusResponse.data; // Return the response if you need it
  } catch (error) {
    console.error("Error fetching order status:", error);
    throw error;
  }
}

// Route to trigger getOrderStatus via HTTP request
app.get("/api/payment/status/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const statusResponse = await getOrderStatus(orderNumber);
    res.status(200).send(statusResponse);
  } catch (error) {
    res.status(500).send({ message: "Error fetching order status", error });
  }
});

// Uncomment this to test getOrderStatus function directly (for console testing)
/*
(async () => {
  try {
    const testOrderNumber = "G123456789"; // Replace with a valid orderNumber
    const response = await getOrderStatus(testOrderNumber);
    console.log("Response from getOrderStatus:", response);
  } catch (error) {
    console.error("Error running getOrderStatus:", error);
  }
})();
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
