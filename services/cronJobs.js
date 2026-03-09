const cron = require("node-cron");
const { sendEmail } = require("./emailService");
const User = require("../models/CustomerSchema");
const Product = require("../models/ProductsSchema");
const Admin = require("../models/AdminSchema");

// 1. Daily: Expired products alert to admins (9 AM)
cron.schedule("0 9 * * *", async () => {
  try {
    const expiredProducts = await Product.find({
      dateOfExpiry: { $lt: new Date() },
    });

    if (expiredProducts.length > 0) {
      const admins = await Admin.find();
      const productList = expiredProducts
        .map((p) => `<li>${p.name} - Expired on ${p.dateOfExpiry.toLocaleDateString()}</li>`)
        .join("");

      for (const admin of admins) {
        await sendEmail(
          admin.email,
          "⚠️ Expired Products Alert",
          `<h2>Expired Products Found</h2><ul>${productList}</ul><p>Please remove these from inventory.</p>`
        );
      }
    }
  } catch (error) {
    console.error("Expired products cron error:", error);
  }
});

// 2. Bi-daily: Low stock alert to admins (8 AM & 6 PM)
cron.schedule("0 8,18 * * *", async () => {
  try {
    const lowStockProducts = await Product.find({
      piecesAvailable: { $lt: 10 }, // Alert if less than 10 pieces
    });

    if (lowStockProducts.length > 0) {
      const admins = await Admin.find();
      const productList = lowStockProducts
        .map((p) => `<li>${p.name} - ${p.piecesAvailable} pieces left</li>`)
        .join("");

      for (const admin of admins) {
        await sendEmail(
          admin.email,
          "📦 Low Stock Alert",
          `<h2>Low Stock Products</h2><ul>${productList}</ul>`
        );
      }
    }
  } catch (error) {
    console.error("Low stock cron error:", error);
  }
});

// 3. Weekly: Promotional email to active customers (Monday 10 AM)
cron.schedule("0 10 * * 1", async () => {
  try {
    const customers = await User.find({ emailPreferences: { $ne: "none" } });
    const topProducts = await Product.find().limit(5);

    const productPromo = topProducts
      .map((p) => `<li>${p.name} - ₹${p.finalPrice}</li>`)
      .join("");

    for (const customer of customers) {
      await sendEmail(
        customer.email,
        "🎉 Exclusive Weekly Deals Just for You!",
        `<h2>Hi ${customer.name}!</h2><p>Check out our top products this week:</p><ul>${productPromo}</ul>`
      );
    }
  } catch (error) {
    console.error("Promotional email cron error:", error);
  }
});

// 4. Daily: Inactive user engagement email (7 AM - for users not logged in last 7 days)
cron.schedule("0 7 * * *", async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const inactiveUsers = await User.find({
      lastLogin: { $lt: sevenDaysAgo },
      emailPreferences: { $ne: "none" }
    });

    for (const user of inactiveUsers) {
      await sendEmail(
        user.email,
        "We Miss You! Come Back to Blinkit",
        `<h2>Hi ${user.name}!</h2><p>We noticed you haven't visited us in a while. Here's a special offer to welcome you back!</p>`
      );
    }
  } catch (error) {
    console.error("Engagement email cron error:", error);
  }
});

module.exports = { startCronJobs: () => {} };