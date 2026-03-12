const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
//git push

router.post("/chatbot", async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Message required" });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Chatbot error details:", error.message, error.stack);
    if (error.status === 404) {
      return res.status(500).json({
        error: "Gemini model not found. This usually means the API key is incorrect or doesn't have access to gemini-1.5-flash."
      });
    }

    // Provide a human-readable fallback for frontend so it doesn't break
    res.status(500).json({
      error: error.message || "Chatbot error",
      reply: "Sorry, I am having trouble connecting to my brain right now. Please check the server logs or API key."
    });
  }
});

module.exports = router;
