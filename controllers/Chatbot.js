const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
//git push
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chatbot", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Chatbot error details:", error.message, error.stack);
    res.status(500).json({ error: error.message || "Chatbot error" });
  }
});

module.exports = router;
