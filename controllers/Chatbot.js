const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini once
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/chatbot", async (req, res) => {
  try {
    console.log("Incoming chatbot request:", req.body);

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured on server",
      });
    }

    // Get Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Generate response
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    const response = result.response;

    const reply =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    res.json({
      reply,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    res.status(500).json({
      error: error.message || "Chatbot error",
      reply:
        "Sorry, I'm having trouble connecting right now. Please try again later.",
    });
  }
});

module.exports = router;