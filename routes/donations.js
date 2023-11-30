const express = require("express");
const mongoose = require("mongoose");
const Donation = require("../models/Donation"); // Adjust the path as needed

const router = express.Router();

// Endpoint to handle donation creation and total calculation
router.post("/donate", async (req, res) => {
  try {
    // Extract the amount from the request body
    const { amount } = req.body;

    // Create a new donation document and save it
    const donation = new Donation({ amount });
    await donation.save();

    // Calculate the new total
    const totalAmount = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Respond with the new total
    res.json({ success: true, total: totalAmount[0].total });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
