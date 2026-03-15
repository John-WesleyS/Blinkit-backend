const cron = require("node-cron");
const { sendEmail } = require("./emailService");
const User = require("../models/CustomerSchema");
const Product = require("../models/ProductsSchema");
const Admin = require("../models/AdminSchema");

console.log("Cron Jobs Initialized...");

// 1️⃣ Daily: Expired products alert to admins (9 AM)
cron.schedule("0 9 * * *", async () => {
  console.log("Running Expired Products Cron Job...");

  try {
    const expiredProducts = await Product.find({
      dateOfExpiry: { $lt: new Date() },
    });

    if (expiredProducts.length === 0) {
      console.log("No expired products found.");
      return;
    }

    const admins = await Admin.find();

    const productList = expiredProducts
      .map(
        (p) =>
          `<li>${p.name} - Expired on ${new Date(
            p.dateOfExpiry
          ).toLocaleDateString()}</li>`
      )
      .join("");

    await Promise.all(
      admins.map(async (admin) => {
        try {
          await sendEmail(
            admin.email,
            "⚠️ Expired Products Alert",
            `<h2>Expired Products Found</h2>
             <ul>${productList}</ul>
             <p>Please remove these from inventory.</p>`
          );
        } catch (err) {
          console.error(`Email failed for admin ${admin.email}:`, err.message);
        }
      })
    );

    console.log("Expired product alert emails sent.");
  } catch (error) {
    console.error("Expired products cron error:", error);
  }
});

// 2️⃣ Bi-daily: Low stock alert to admins (8 AM & 6 PM)
cron.schedule("0 8,18 * * *", async () => {
  console.log("Running Low Stock Cron Job...");

  try {
    const lowStockProducts = await Product.find({
      piecesAvailable: { $lt: 10 },
    });

    if (lowStockProducts.length === 0) {
      console.log("No low stock products.");
      return;
    }

    const admins = await Admin.find();

    const productList = lowStockProducts
      .map((p) => `<li>${p.name} - ${p.piecesAvailable} pieces left</li>`)
      .join("");

    await Promise.all(
      admins.map(async (admin) => {
        try {
          await sendEmail(
            admin.email,
            "📦 Low Stock Alert",
            `<h2>Low Stock Products</h2><ul>${productList}</ul>`
          );
        } catch (err) {
          console.error(`Email failed for admin ${admin.email}:`, err.message);
        }
      })
    );

    console.log("Low stock alert emails sent.");
  } catch (error) {
    console.error("Low stock cron error:", error);
  }
});

// 3️⃣ Weekly: Promotional email to active customers (Monday 10 AM)
cron.schedule("0 10 * * 1", async () => {
  console.log("Running Weekly Promotion Cron Job...");

  try {
    const customers = await User.find({ emailPreferences: { $ne: "none" } });
    const topProducts = await Product.find().limit(5);

    const productPromo = topProducts
      .map((p) => `<li>${p.name} - ₹${p.finalPrice}</li>`)
      .join("");

    await Promise.all(
      customers.map(async (customer) => {
        try {
          await sendEmail(
            customer.email,
            "🎉 Exclusive Weekly Deals Just for You!",
            `<h2>Hi ${customer.name}!</h2>
             <p>Check out our top products this week:</p>
             <ul>${productPromo}</ul>`
          );
        } catch (err) {
          console.error(
            `Promo email failed for ${customer.email}:`,
            err.message
          );
        }
      })
    );

    console.log("Promotional emails sent.");
  } catch (error) {
    console.error("Promotional email cron error:", error);
  }
});

// 4️⃣ Daily: Inactive user engagement email (7 AM)
cron.schedule("0 7 * * *", async () => {
  console.log("Running Inactive User Engagement Cron Job...");

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await User.find({
      lastLogin: { $lt: sevenDaysAgo },
      emailPreferences: { $ne: "none" },
    });

    if (inactiveUsers.length === 0) {
      console.log("No inactive users.");
      return;
    }

    await Promise.all(
      inactiveUsers.map(async (user) => {
        try {
          await sendEmail(
            user.email,
            "We Miss You! Come Back to Blinkit",
            `<h2>Hi ${user.name}!</h2>
             <p>We noticed you haven't visited us in a while.</p>
             <p>Come back and explore new deals waiting for you!</p>`
          );
        } catch (err) {
          console.error(`Engagement email failed for ${user.email}:`, err.message);
        }
      })
    );

    console.log("Inactive user emails sent.");
  } catch (error) {
    console.error("Engagement email cron error:", error);
  }
});