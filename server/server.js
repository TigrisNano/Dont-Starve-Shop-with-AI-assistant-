const { generateReply } = require("./aiService");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const promocodesPath = path.join(__dirname, "promocodes.json");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.newCategory || req.body.category;
    const folder = path.join(__dirname, "..", "public", "images", category);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const fileName = req.body.imageName || file.originalname;
    cb(null, fileName);
  },
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = "your_secret_key_here";

const itemsDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "shop_items",
});

const accountsDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "shop_accounts",
});

const ordersDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "shop_orders",
});

const reviewsDb = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "shop_reviews",
});

app.get("/api/items", (req, res) => {
  const tables = [
    "Tools",
    "Light",
    "Survival",
    "Food",
    "Science",
    "Fight",
    "Structures",
    "Refine",
    "Magic",
    "Dress",
    "Ancient",
  ];

  const promises = tables.map(
    (table) =>
      new Promise((resolve, reject) => {
        itemsDb.query(
          `SELECT *, '${table}' AS category FROM ${table}`,
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      })
  );

  Promise.all(promises)
    .then((results) => {
      const items = results.flat();
      res.json(items);
    })
    .catch((error) => res.status(500).json({ error: error.message || error }));
});

app.post("/api/register", async (req, res) => {
  console.log("Register body:", req.body);

  const { login_email, password, username, phone_number } = req.body;

  if (!login_email || !password || !username) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    accountsDb.query(
      "INSERT INTO users (login_email, password, username, role_id, phone_number, balance) VALUES (?, ?, ?, ?, ?, ?)",
      [login_email, hashedPassword, username, 3, phone_number || null, 0],
      (err, result) => {
        if (err) {
          console.error("Registration error:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email already registered" });
          }
          return res
            .status(500)
            .json({ error: "DB error during registration" });
        }
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.error("Hashing error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/login", (req, res) => {
  const { login_email, password } = req.body;

  if (!login_email || !password) {
    return res.status(400).json({ error: "Missing login or password" });
  }

  accountsDb.query(
    "SELECT * FROM users WHERE login_email = ?",
    [login_email],
    async (err, results) => {
      if (err) {
        console.error("Login DB error:", err);
        return res.status(500).json({ error: "DB error during login" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          username: user.username,
          role_id: user.role_id,
          balance: user.balance,
        },
        SECRET_KEY,
        { expiresIn: "2h" }
      );

      res.json({ token });
    }
  );
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

function authorizeAdmin(req, res, next) {
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    return next();
  }
  return res.status(403).json({ error: "Access denied" });
}

app.get("/api/admin-data", authenticateToken, authorizeAdmin, (req, res) => {
  res.json({ message: `Welcome to admin panel, ${req.user.username}` });
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}, your role is ${req.user.role_id}`,
  });
});

app.get("/api/profile", authenticateToken, (req, res) => {
  const userId = req.user.user_id;

  accountsDb.query(
    "SELECT username, login_email, phone_number, balance FROM users WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB error fetching profile:", err);
        return res.status(500).json({ error: "DB error fetching profile" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(results[0]);
    }
  );
});

app.put("/api/profile", authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const { username, login_email, phone_number, password } = req.body;

  const fields = [];
  const values = [];

  if (username !== undefined) {
    fields.push("username = ?");
    values.push(username);
  }

  if (login_email !== undefined) {
    fields.push("login_email = ?");
    values.push(login_email);
  }

  if (phone_number !== undefined) {
    fields.push("phone_number = ?");
    values.push(phone_number);
  }

  try {
    if (password !== undefined && password !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`;

    accountsDb.query(sql, values, (err, result) => {
      if (err) {
        console.error("DB error updating profile:", err);
        return res.status(500).json({ error: "DB error updating profile" });
      }
      res.json({ message: "Profile updated successfully" });
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
});

function authorizeOwner(req, res, next) {
  if (req.user.role_id === 1) {
    return next();
  }
  return res.status(403).json({ error: "Access denied" });
}

app.get("/api/users", authenticateToken, authorizeAdmin, (req, res) => {
  const sql = `
    SELECT u.user_id, u.username, r.role_name, u.role_id
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.role_id != 1
  `;

  accountsDb.query(sql, (err, results) => {
    if (err) {
      console.error("DB error fetching users:", err);
      return res.status(500).json({ error: "DB error fetching users" });
    }
    res.json(results);
  });
});

app.put(
  "/api/users/:id/role",
  authenticateToken,
  authorizeOwner,
  (req, res) => {
    const userId = req.params.id;
    const { role_id } = req.body;

    if (![1, 2, 3].includes(role_id)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }

    accountsDb.query(
      "UPDATE users SET role_id = ? WHERE user_id = ?",
      [role_id, userId],
      (err, result) => {
        if (err) {
          console.error("DB error updating role:", err);
          return res.status(500).json({ error: "DB error updating role" });
        }
        res.json({ message: "User role updated successfully" });
      }
    );
  }
);

app.get("/api/users/:id/balance", authenticateToken, (req, res) => {
  const userId = req.params.id;

  accountsDb.query(
    "SELECT balance FROM users WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB error fetching balance:", err);
        return res.status(500).json({ error: "DB error fetching balance" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ balance: results[0].balance });
    }
  );
});

app.put("/api/balance", authenticateToken, (req, res) => {
  const userId = req.user.user_id;
  const { balance } = req.body;

  if (typeof balance !== "number") {
    return res.status(400).json({ error: "Invalid balance" });
  }

  accountsDb.query(
    "UPDATE users SET balance = ? WHERE user_id = ?",
    [balance, userId],
    (err, result) => {
      if (err) {
        console.error("DB error updating balance:", err);
        return res.status(500).json({ error: "DB error updating balance" });
      }
      res.json({ message: "Balance updated successfully" });
    }
  );
});

app.post("/api/orders", authenticateToken, (req, res) => {
  const userId = req.user.user_id;
  const username = req.user.username;
  const { items, totalPrice } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  accountsDb.query(
    "SELECT balance FROM users WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB error checking balance:", err);
        return res.status(500).json({ error: "DB error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const balance = results[0].balance;
      if (balance < totalPrice) {
        return res.status(400).json({ error: "Not enough balance" });
      }

      const newBalance = balance - totalPrice;

      accountsDb.beginTransaction((err) => {
        if (err) return res.status(500).json({ error: "Transaction error" });

        accountsDb.query(
          "UPDATE users SET balance = ? WHERE user_id = ?",
          [newBalance, userId],
          (err) => {
            if (err) {
              return accountsDb.rollback(() => {
                console.error("Balance update error:", err);
                res.status(500).json({ error: "Balance update failed" });
              });
            }

            ordersDb.query(
              "INSERT INTO orders (user_id, username, items, total_price) VALUES (?, ?, ?, ?)",
              [userId, username, JSON.stringify(items), totalPrice],
              (err, result) => {
                if (err) {
                  return accountsDb.rollback(() => {
                    console.error("Order insert error:", err);
                    res.status(500).json({ error: "Order insert failed" });
                  });
                }

                accountsDb.commit((err) => {
                  if (err) {
                    return accountsDb.rollback(() => {
                      res.status(500).json({ error: "Commit failed" });
                    });
                  }

                  res.json({
                    message: "Order placed successfully",
                    orderId: result.insertId,
                    newBalance,
                  });
                });
              }
            );
          }
        );
      });
    }
  );
});

app.get("/api/orders/user", authenticateToken, (req, res) => {
  const userId = req.user.user_id;

  ordersDb.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC",
    [userId],
    (err, results) => {
      if (err) {
        console.error("DB error fetching orders:", err);
        return res.status(500).json({ error: "DB error fetching orders" });
      }

      if (results.length === 0) {
        return res.json([]);
      }

      const orders = results.map((order) => ({
        ...order,
        items: JSON.parse(order.items || "[]"),
      }));

      res.json(orders);
    }
  );
});

app.get("/api/reviews/:itemKey", (req, res) => {
  const itemKey = req.params.itemKey;

  reviewsDb.query(
    "SELECT * FROM reviews WHERE item_key = ? ORDER BY created_at DESC",
    [itemKey],
    (err, results) => {
      if (err) {
        console.error("DB error fetching reviews:", err);
        return res.status(500).json({ error: "DB error fetching reviews" });
      }
      res.json(results);
    }
  );
});

app.post("/api/reviews/:itemKey", authenticateToken, (req, res) => {
  const itemKey = req.params.itemKey;
  const { rating, review_text } = req.body;
  const username = req.user.username;
  const userId = req.user.user_id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  reviewsDb.query(
    "INSERT INTO reviews (item_key, user_id, username, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
    [itemKey, userId, username, rating, review_text || ""],
    (err, result) => {
      if (err) {
        console.error("DB error adding review:", err);
        return res.status(500).json({ error: "DB error adding review" });
      }
      res.json({
        message: "Review added successfully",
        review_id: result.insertId,
      });
    }
  );
});

app.put("/api/reviews/:reviewId", authenticateToken, (req, res) => {
  const reviewId = req.params.reviewId;
  const { rating, review_text } = req.body;
  const userId = req.user.user_id;

  reviewsDb.query(
    "SELECT user_id FROM reviews WHERE review_id = ?",
    [reviewId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (results.length === 0)
        return res.status(404).json({ error: "Review not found" });

      if (results[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "You can edit only your reviews" });
      }

      reviewsDb.query(
        "UPDATE reviews SET rating = ?, review_text = ? WHERE review_id = ?",
        [rating, review_text, reviewId],
        (err2) => {
          if (err2) {
            console.error("DB error updating review:", err2);
            return res.status(500).json({ error: "DB error updating review" });
          }
          res.json({ message: "Review updated successfully" });
        }
      );
    }
  );
});

app.delete("/api/reviews/:reviewId", authenticateToken, (req, res) => {
  const reviewId = req.params.reviewId;
  const userId = req.user.user_id;

  reviewsDb.query(
    "SELECT user_id FROM reviews WHERE review_id = ?",
    [reviewId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (results.length === 0)
        return res.status(404).json({ error: "Review not found" });

      if (results[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "You can delete only your reviews" });
      }

      reviewsDb.query(
        "DELETE FROM reviews WHERE review_id = ?",
        [reviewId],
        (err2) => {
          if (err2) {
            console.error("DB error deleting review:", err2);
            return res.status(500).json({ error: "DB error deleting review" });
          }
          res.json({ message: "Review deleted successfully" });
        }
      );
    }
  );
});

app.put("/api/items/:category/:id", upload.single("image"), (req, res) => {
  const { category, id } = req.params;
  const { name, price, quantity, description, newCategory } = req.body;

  const imagePath = req.file
    ? `/images/${newCategory || category}/${req.file.filename}`
    : null;

  let sql = `UPDATE \`${category}\` SET name=?, price=?, quantity=?, description=?`;
  const values = [name, price, quantity, description];

  if (imagePath) {
    sql += `, image_path=?`;
    values.push(imagePath);
  }

  sql += ` WHERE id=?`;
  values.push(id);

  itemsDb.query(sql, values, (err, result) => {
    if (err) {
      console.error("DB error updating item:", err);
      return res.status(500).json({ error: "DB error updating item" });
    }

    if (newCategory && newCategory !== category) {
      itemsDb.query(
        `SELECT * FROM \`${category}\` WHERE id=?`,
        [id],
        (err2, rows) => {
          if (err2 || rows.length === 0)
            return res.json({ message: "Item updated" });
          const item = rows[0];
          delete item.id;
          itemsDb.query(
            `INSERT INTO \`${newCategory}\` SET ?`,
            item,
            (err3) => {
              if (err3) console.error("Error moving item:", err3);
              else
                itemsDb.query(`DELETE FROM \`${category}\` WHERE id=?`, [id]);
            }
          );
        }
      );
    }

    res.json({ message: "Item updated successfully" });
  });
});

app.delete("/api/items/:category/:id", (req, res) => {
  const { category, id } = req.params;

  const allowedTables = [
    "Tools",
    "Light",
    "Survival",
    "Food",
    "Science",
    "Fight",
    "Structures",
    "Refine",
    "Magic",
    "Dress",
    "Ancient",
  ];

  if (!allowedTables.includes(category)) {
    return res.status(400).json({ error: "Невірна категорія" });
  }

  const sql = `DELETE FROM \`${category}\` WHERE id = ?`;
  itemsDb.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Помилка видалення товару:", err);
      return res
        .status(500)
        .json({ error: "Помилка сервера при видаленні товару" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Товар не знайдено" });
    }

    console.log(`Товар з ID ${id} видалено з категорії ${category}`);
    res.json({ message: "Товар успішно видалено" });
  });
});

app.post("/api/items", upload.single("image"), (req, res) => {
  const { name, price, quantity, description, category } = req.body;

  if (!name || !price || !quantity || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const imagePath = req.file
    ? `/images/${category}/${req.file.filename}`
    : null;

  const sql = `INSERT INTO \`${category}\` (name, price, quantity, description, image_path) VALUES (?, ?, ?, ?, ?)`;
  const values = [name, price, quantity, description || "", imagePath];

  itemsDb.query(sql, values, (err, result) => {
    if (err) {
      console.error("DB error adding item:", err);
      return res.status(500).json({ error: "DB error adding item" });
    }
    res.json({ message: "Item added successfully", id: result.insertId });
  });
});

app.get("/api/analytics/categories/year", (req, res) => {
  const sql = `
    SELECT 
      cat AS category,
      SUM(qty) AS count
    FROM (
      SELECT 
        JSON_VALUE(items, CONCAT('$[', n.n, '].category')) AS cat,
        JSON_VALUE(items, CONCAT('$[', n.n, '].quantity')) AS qty
      FROM orders
      JOIN (
        SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
      ) AS n
      ON n.n < JSON_LENGTH(items)
      WHERE YEAR(order_date) = YEAR(CURRENT_DATE())
    ) AS t
    WHERE cat IS NOT NULL
    GROUP BY cat
    ORDER BY count DESC
    LIMIT 11;
  `;

  ordersDb.query(sql, (err, results) => {
    if (err) {
      console.error("Analytics categories/year error:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

app.get("/api/analytics/categories/month", (req, res) => {
  const sql = `
    SELECT 
      cat AS category,
      SUM(qty) AS count
    FROM (
      SELECT 
        JSON_VALUE(items, CONCAT('$[', n.n, '].category')) AS cat,
        JSON_VALUE(items, CONCAT('$[', n.n, '].quantity')) AS qty
      FROM orders
      JOIN (
        SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
      ) AS n
      ON n.n < JSON_LENGTH(items)
      WHERE YEAR(order_date) = YEAR(CURRENT_DATE())
        AND MONTH(order_date) = MONTH(CURRENT_DATE())
    ) AS t
    WHERE cat IS NOT NULL
    GROUP BY cat
    ORDER BY count DESC
    LIMIT 11;
  `;

  ordersDb.query(sql, (err, results) => {
    if (err) {
      console.error("Analytics categories/month error:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

app.get("/api/analytics/sales/year", (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(order_date, '%Y-%m') AS month,
      SUM(total_price) AS total
    FROM orders
    WHERE YEAR(order_date) = YEAR(CURRENT_DATE())
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY DATE_FORMAT(order_date, '%Y-%m');
  `;

  ordersDb.query(sql, (err, results) => {
    if (err) {
      console.error("Analytics sales/year error:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(results);
  });
});

app.post("/api/wallet/promocode", authenticateToken, (req, res) => {
  const { code } = req.body;
  const userId = req.user.user_id;

  if (!code) {
    return res.status(400).json({ error: "Promo code is required" });
  }

  fs.readFile(promocodesPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Cannot read promo file" });

    let codes = {};
    try {
      codes = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: "Promo file corrupted" });
    }

    const promo = codes[code];

    if (!promo) {
      return res.status(400).json({ error: "Invalid promo code" });
    }

    const amount = promo.amount;
    const expires = promo.expires;

    const now = new Date();
    const expDate = new Date(expires);

    if (now > expDate) {
      return res.status(400).json({ error: "Promo code has expired" });
    }

    accountsDb.query(
      "SELECT * FROM used_promocodes WHERE user_id = ? AND code = ?",
      [userId, code],
      (err, rows) => {
        if (err)
          return res.status(500).json({ error: "DB error checking usage" });

        if (rows.length > 0) {
          return res
            .status(400)
            .json({ error: "You have already used this promo code" });
        }

        accountsDb.query(
          "UPDATE users SET balance = balance + ? WHERE user_id = ?",
          [amount, userId],
          (err) => {
            if (err)
              return res.status(500).json({ error: "Error updating balance" });

            accountsDb.query(
              "INSERT INTO used_promocodes (user_id, code) VALUES (?, ?)",
              [userId, code]
            );

            return res.json({
              message: "Promo code applied successfully",
              amount,
              expires,
            });
          }
        );
      }
    );
  });
});

const itemCategories = [
  "tools",
  "light",
  "survival",
  "food",
  "science",
  "fight",
  "structures",
  "refine",
  "magic",
  "dress",
  "ancient",
];

async function getAllItems() {
  const allItems = [];
  for (const category of itemCategories) {
    const rows = await new Promise((resolve, reject) => {
      itemsDb.query(
        "SELECT id, name, price, quantity, description, ? AS category FROM ?? ORDER BY id DESC LIMIT 50",
        [category, category],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
    allItems.push(...rows);
  }
  return allItems;
}

async function getAllReviews() {
  return new Promise((resolve, reject) => {
    reviewsDb.query(
      "SELECT review_id, item_id, username, rating, review_text FROM reviews ORDER BY review_id DESC LIMIT 50",
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const items = await getAllItems();
    const reviews = await getAllReviews();

    const reply = await generateReply(message, items, reviews);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "AI is unavailable." });
  }
});

app.listen(3001, () => {
  console.log("Сервер запущено на порту 3001");
});
