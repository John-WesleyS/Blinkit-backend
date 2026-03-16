const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { verifyToken, verifyAdmin } = require("./middleware/verifyToken");
const chatbotRoutes = require("./controllers/Chatbot");
// const authRoutes = require("./routes/Auth");
const authRoutes = require("./routes/Auth");
// const chatbotRoutes = require("./controllers/Chatbot");

const Customer = require("./models/CustomerSchema");
const Admin = require("./models/AdminSchema");
const Product = require("./models/ProductsSchema");
const { sendEmail } = require("./services/emailService");

const redisClient = require("./config/RedisClient");
// const { cache } = require("react");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        origin.includes("vercel.app") ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// app.use(cors());
app.use(express.json());

console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("MONGO_URI:", process.env.MONGO_URI);

// connectDB();

require("./services/cronJobs"); // Initialize cron jobs

app.use("/", authRoutes);
app.use("/", chatbotRoutes);

app.get("/", (req, res) => {
  res.send("Blinkit Backend Running");
});

app.get("/email-test", async (req, res) => {
  try {
    await sendEmail(
      "johnwesleybarre588@gmail.com",
      "Blinkit Test",
      "<h2>Email system works</h2>",
    );

    res.send("Email sent");
  } catch (err) {
    res.send(err.message);
  }
});

app.post("/AdminCart", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      gst,
      DeliveryFee,
      imageUrl,
      dateOfManufactured,
      dateOfExpiry,
      finalPrice,
      piecesAvailable,
      Category,
      // DeliveryFee,
    } = req.body;

    const exists = await Product.findOne({ imageUrl });

    if (exists) {
      await Product.updateOne(
        { _id: exists._id },
        {
          $set: {
            name,
            price,
            gst,
            imageUrl,
            dateOfManufactured,
            dateOfExpiry,
            finalPrice,
            piecesAvailable,
            Category,
            DeliveryFee,
          },
        },
      );
      try {
        await redisClient.del("products");
        await redisClient.del(`product:${name}`);
      } catch (err) {
        console.error("Redis Error invalidating cache:", err.message);
      }
      return res.json({ message: "Product Updated" });
    }

    await Product.create({
      name,
      price,
      gst,
      imageUrl,
      dateOfManufactured,
      dateOfExpiry,
      finalPrice,
      piecesAvailable,
      Category,
      DeliveryFee,
    });
    try {
      await redisClient.del("products");
    } catch (err) {
        console.error("Redis Error invalidating cache:", err.message);
    }
    res.json({ message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/AdminCart", async (req, res) => {
  try {
    const cacheKey = "products";
    let cachedProducts = null;

    try {
      cachedProducts = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("Redis Get Error (GET /AdminCart):", err.message);
    }

    if (cachedProducts) {
      return res.json(JSON.parse(cachedProducts));
    }
    const products = await Product.find().lean();
    
    try {
      await redisClient.setEx(cacheKey, 100, JSON.stringify(products));
    } catch (err) {
      console.error("Redis Set Error (GET /AdminCart):", err.message);
    }
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/AdminCart/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await Product.findById(id);

    await Product.findByIdAndDelete(id);

    try {
      await redisClient.del("products");
      if (existingProduct) {
        await redisClient.del(`product:${existingProduct.name}`);
      }
    } catch (err) {
      console.error("Redis Error invalidating cache:", err.message);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/address", verifyToken, async (req, res) => {
  const user = await Customer.findById(req.user.id);
  res.json({
    city: user.city,
    area: user.area,
    doorNumber: user.doorNumber,
  });
});

app.get("/products/:name", async (req, res) => {
  try {
    const rawName = decodeURIComponent(req.params.name).trim();
    const cacheKey = `product:${rawName}`;

    let cachedProduct = null;
    try {
      cachedProduct = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("Redis Get Error (GET /products/:name):", err.message);
    }

    if (cachedProduct) {
      return res.json(JSON.parse(cachedProduct));
    }

    const product = await Product.findOne({
      name: { $regex: `^${rawName}$`, $options: "i" },
    }).lean();

    if (!product) return res.status(404).json({ error: "Not found" });

    try {
      await redisClient.setEx(cacheKey, 120, JSON.stringify(product));
    } catch (err) {
      console.error("Redis Set Error (GET /products/:name):", err.message);
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/Dashboard", verifyToken, async (req, res) => {
  try {
    const user = await Customer.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000; // Use the dynamic port first!
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await redisClient.quit();
      console.log("Redis client disconnected.");
    } catch (err) {
      console.error("Error shutting down Redis client:", err.message);
    }
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
