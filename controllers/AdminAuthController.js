const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Admin = require("../models/AdminSchema");
const { sendEmail } = require("../services/emailService");

const AdminSignin= async (req, res) => {
  try {
    const { name, phone, email, role, password } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "User Exists" });
    const hash = await bcrypt.hash(password, 10);
    const admin = await new Admin({
      name,
      email,
      phone,
      role,
      password: hash,
    }).save();
    res.json({ AdminId: admin._id });

    // Send admin welcome email (non-blocking)
    sendEmail(
      admin.email,
      "Admin Account Created - Blinkit",
      `<h2>Welcome ${admin.name}!</h2><p>Your admin account has been created successfully.</p><p>Role: ${admin.role}</p><p>You can now login to manage the platform.</p>`
    ).catch(err => console.error("Admin signup email error:", err));
  } catch (e) {
    res.status(500).json({ error: e });
  }
};

const AdminLogin= async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Admin.findOne({ email });
    if (!user) return res.status(400).json({ message: "No User" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong Password" });

    const token = jwt.sign({ id: user._id , role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token }); // fixed

    // Send admin login notification email (non-blocking)
    sendEmail(
      user.email,
      "Admin Login Alert - Blinkit",
      `<h2>Hi ${user.name}!</h2><p>You have successfully logged in to your admin account.</p><p>Login time: ${new Date().toLocaleString()}</p><p>Role: ${user.role}</p><p>If this wasn't you, please secure your account immediately.</p>`
    ).catch(err => console.error("Admin login email error:", err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports={AdminLogin,AdminSignin}