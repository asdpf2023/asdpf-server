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
    // Store this securely or not at all, depending on your security requirements
  },
  amount: {
    type: Number,
    required: true,
  },
  // Add additional fields as needed
});

// Create the model from the schema
const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
