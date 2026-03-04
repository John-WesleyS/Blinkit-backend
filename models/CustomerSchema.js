const mongoose=require("mongoose")

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true },
  state: String,
  city: String,
  area: String,
  doorNumber: String,
  password: String,
});

module.exports = mongoose.model("User", userSchema);