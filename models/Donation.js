const mongoose = require("mongoose");

// Define the schema for the donation
const donationSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    // Mask or encrypt this data as needed for security
  },
  email: {
    type: String,
    required: true,
  },
});

// Create the model from the schema
const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
