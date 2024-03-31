const mongoose = require("mongoose");

// Define the schema for the donation
const donationSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    // Mask or encrypt this data as needed for security
  },
  cardHolderName: {
    type: String,
    required: true,
  },
  expiryMonth: {
    type: String,
    required: true,
  },
  expiryYear: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

// Create the model from the schema
const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
