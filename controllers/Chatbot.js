const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(message);
    const response = await result.response;

    res.json({
      reply: response.text(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Chatbot error" });
  }
});

module.exports = router;
