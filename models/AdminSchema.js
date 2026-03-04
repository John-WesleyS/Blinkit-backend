const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  role:String,
  password: { type: String, unique: true },
});

module.exports = mongoose.model("Admin", adminSchema);
