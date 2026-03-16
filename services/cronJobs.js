const cron = require("node-cron");
const { sendEmail } = require("./emailService");

const User = require("../models/CustomerSchema");
const Product = require("../models/ProductsSchema");
const Admin = require("../models/AdminSchema");

const redisClient = require("../config/RedisClient");

console.log("Cron Jobs Initialized...");

/* ------------------------------------------------ */
/* 1️⃣ DAILY EXPIRED PRODUCT ALERT (9 AM) */
/* ------------------------------------------------ */

cron.schedule("0 9 * * *", async () => {
  console.log("Running Expired Products Cron Job...");

  try {
    const cacheKey = "expiredProducts";

    let expiredProducts = null;

    try {
      const cachedProducts = await redisClient.get(cacheKey);

      if (cachedProducts) {
        expiredProducts = JSON.parse(cachedProducts);
        console.log("Using cached expired products");
      }
    } catch (err) {
      console.error("Redis Get Error (Expired Products):", err.message);
    }
    
    if (!expiredProducts) {
      expiredProducts = await Product.find({
        dateOfExpiry: { $lt: new Date() },
      }).lean();

      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(expiredProducts));
      } catch (err) {
        console.error("Redis Set Error (Expired Products):", err.message);
      }
    }

    if (expiredProducts.length === 0) {
      console.log("No expired products");
      return;
    }

    const admins = await Admin.find();

    const productList = expiredProducts
      .map(
        (p) =>
          `<li>${p.name} - Expired on ${new Date(
            p.dateOfExpiry,
          ).toLocaleDateString()}</li>`,
      )
      .join("");

    await Promise.all(
      admins.map(async (admin) => {
        const emailKey = `expiredEmail:${admin.email}`;

        let alreadySent = false;
        try {
          alreadySent = await redisClient.get(emailKey);
        } catch (err) {
          console.error(`Redis Get Error (Email Sent Check for ${admin.email}):`, err.message);
        }

        if (alreadySent) {
          console.log("Email already sent today:", admin.email);
          return;
        }

        await sendEmail(
          admin.email,
          "⚠️ Expired Products Alert",
          `<h2>Expired Products Found</h2>
           <ul>${productList}</ul>
           <p>Please remove these products from inventory.</p>`,
        );

        try {
            await redisClient.setEx(emailKey, 86400, "sent");
        } catch (err) {
            console.error(`Redis Set Error (Email Sent Check for ${admin.email}):`, err.message);
        }
      }),
    );

    console.log("Expired product emails sent");
  } catch (err) {
    console.error("Expired cron error:", err);
  }
});

/* ------------------------------------------------ */
/* 2️⃣ LOW STOCK ALERT (8 AM & 6 PM) */
/* ------------------------------------------------ */

cron.schedule("0 8,18 * * *", async () => {
  console.log("Running Low Stock Cron Job...");

  try {
    const cacheKey = "lowStockProducts";

    let lowStockProducts = null;

    try {
      const cachedProducts = await redisClient.get(cacheKey);

      if (cachedProducts) {
        lowStockProducts = JSON.parse(cachedProducts);
        console.log("Using cached low stock products");
      }
    } catch (err) {
      console.error("Redis Get Error (Low Stock):", err.message);
    }
    
    if (!lowStockProducts) {
      lowStockProducts = await Product.find({
        piecesAvailable: { $lt: 10 },
      }).lean();

      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(lowStockProducts));
      } catch (err) {
        console.error("Redis Set Error (Low Stock):", err.message);
      }
    }

    if (lowStockProducts.length === 0) {
      console.log("No low stock products");
      return;
    }

    const admins = await Admin.find();

    const productList = lowStockProducts
      .map((p) => `<li>${p.name} - ${p.piecesAvailable} pieces left</li>`)
      .join("");

    await Promise.all(
      admins.map(async (admin) => {
        await sendEmail(
          admin.email,
          "📦 Low Stock Alert",
          `<h2>Low Stock Products</h2>
           <ul>${productList}</ul>
           <p>Please restock these products.</p>`,
        );
      }),
    );

    console.log("Low stock emails sent");
  } catch (err) {
    console.error("Low stock cron error:", err);
  }
});

/* ------------------------------------------------ */
/* 3️⃣ WEEKLY PROMOTION EMAIL (MONDAY 10 AM) */
/* ------------------------------------------------ */

cron.schedule("0 10 * * 1", async () => {
  console.log("Running Weekly Promotion Cron Job...");

  try {
    const cacheKey = "weeklyTopProducts";

    let topProducts = null;

    try {
      const cachedProducts = await redisClient.get(cacheKey);

      if (cachedProducts) {
        topProducts = JSON.parse(cachedProducts);
        console.log("Using cached promotion products");
      }
    } catch (err) {
        console.error("Redis Get Error (Promotions):", err.message);
    }
    
    if (!topProducts) {
      topProducts = await Product.find().limit(5).lean();

      try {
          await redisClient.setEx(cacheKey, 86400, JSON.stringify(topProducts));
      } catch (err) {
          console.error("Redis Set Error (Promotions):", err.message);
      }
    }

    const customers = await User.find({
      emailPreferences: { $ne: "none" },
    });

    const productPromo = topProducts
      .map((p) => `<li>${p.name} - ₹${p.finalPrice}</li>`)
      .join("");

    await Promise.all(
      customers.map(async (customer) => {
        await sendEmail(
          customer.email,
          "🎉 Exclusive Weekly Deals!",
          `<h2>Hi ${customer.name}</h2>
           <p>Here are this week's best deals:</p>
           <ul>${productPromo}</ul>
           <p>Shop now before they run out!</p>`,
        );
      }),
    );

    console.log("Promotional emails sent");
  } catch (err) {
    console.error("Promotion cron error:", err);
  }
});

/* ------------------------------------------------ */
/* 4️⃣ INACTIVE USER EMAIL (DAILY 7 AM) */
/* ------------------------------------------------ */

cron.schedule("0 7 * * *", async () => {
  console.log("Running Inactive User Engagement Cron Job...");

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await User.find({
      lastLogin: { $lt: sevenDaysAgo },
      emailPreferences: { $ne: "none" },
    });

    if (inactiveUsers.length === 0) {
      console.log("No inactive users");
      return;
    }

    await Promise.all(
      inactiveUsers.map(async (user) => {
        const emailKey = `inactiveEmail:${user.email}`;

        let alreadySent = false;
        try {
            alreadySent = await redisClient.get(emailKey);
        } catch (err) {
             console.error(`Redis Get Error (Inactive Check for ${user.email}):`, err.message);
        }

        if (alreadySent) {
          console.log("Already sent engagement email:", user.email);
          return;
        }

        await sendEmail(
          user.email,
          "We Miss You at Blinkit!",
          `<h2>Hello ${user.name}</h2>
           <p>It's been a while since you visited us.</p>
           <p>Come back and check out our new deals waiting for you!</p>`,
        );

        try {
            await redisClient.setEx(emailKey, 86400, "sent");
        } catch (err) {
             console.error(`Redis Set Error (Inactive check for ${user.email}):`, err.message);
        }
      }),
    );

    console.log("Inactive user emails sent");
  } catch (err) {
    console.error("Inactive user cron error:", err);
  }
});
