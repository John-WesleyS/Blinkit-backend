const express = require("express");
const router = express.Router();

const GEMINI_MODEL = "gemini-2.5-flash";

async function getGeminiResponse(userMessage) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return "Missing Gemini API key. Add GEMINI_API_KEY in your .env file and restart the app.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    }
    );

    const data = await response.json();
    console.log("Gemini raw response:", data);

    if (!response.ok) {
      return data.error?.message || "Gemini API error";
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (err) {
    console.error(err);
    return "Network error";
  }
}

router.post("/chatbot", async (req, res) => {
  try {
    console.log("Incoming chatbot request:", req.body);

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const reply = await getGeminiResponse(message);

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