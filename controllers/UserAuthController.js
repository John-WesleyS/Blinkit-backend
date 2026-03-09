const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Customer = require("../models/CustomerSchema");
const { sendEmail } = require("../services/emailService");

const UserSignin = async (req, res) => {
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

    // Send welcome email (non-blocking)
    sendEmail(
      user.email,
      "Welcome to Blinkit!",
      `<h2>Welcome ${user.name}!</h2><p>Thank you for signing up with Blinkit.</p><p>Your account has been created successfully.</p><p>You can now login and start shopping!</p>`,
    ).catch((err) => console.error("Signup email error:", err));
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

const UserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Customer.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "No user found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user.lastLogin = new Date();
    await user.save();

    res.json({ token });

    // Send login notification email (non-blocking)
    if (user.emailPreferences !== "none") {
      sendEmail(
        user.email,
        "Welcome back to Blinkit!",
        `<h2>Hi ${user.name}!</h2><p>You have successfully logged in to your Blinkit account.</p><p>Login time: ${new Date().toLocaleString()}</p><p>If this wasn't you, please contact support immediately.</p>`,
      ).catch((err) => console.error("Login email error:", err));
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  UserLogin,
  UserSignin,
};
