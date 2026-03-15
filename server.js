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

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin.includes("vercel.app") || origin.includes("localhost")) {
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

    res.json({ message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/AdminCart", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/AdminCart/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await Product.findByIdAndDelete(id);

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
  const rawName = decodeURIComponent(req.params.name).trim();
  const product = await Product.findOne({
    name: { $regex: `^${rawName}$`, $options: "i" },
  });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
