const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Customer = require("../models/CustomerSchema");

const UserSignin= async (req, res) => {
  try {
    const { name, email, phone, state, city, area, doorNumber, password } =
      req.body;
    const exists = await Customer.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await new Customer({
      name,
      email,
      phone,
      state,
      city,
      area,
      doorNumber,
      password: hash,
    }).save();
    res.json({ userId: user._id });
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

const UserLogin= async (req, res) => {
  const { email, password } = req.body;
  const user = await Customer.findOne({ email });
  if (!user) return res.status(400).json({ message: "No user" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong pass" });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ token });
};

module.exports={
  UserLogin,UserSignin
}