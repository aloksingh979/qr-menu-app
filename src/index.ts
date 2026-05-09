import dotenv from "dotenv";
import express from "express";
import pool from "./db.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("Server running...");
});

// app.listen(5000, () => {
//     console.log("Server started on port 5000");
// }); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// // DB test route
app.get("/test-db", async (req, res) => {
    console.log("DB URL:", process.env.DATABASE_URL);

    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/test/qr", async (req, res) => {
    try {
        const response = await pool.query("SELECT NOW()");
        res.json(response.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get menu items for a specific restaurant
app.get("/menu/:restaurantId", async (req, res) => {
    const { restaurantId } = req.params;
    console.log("DB URL:", process.env.DATABASE_URL);


    try {
        const result = await pool.query(
            `SELECT * FROM menu_item 
       WHERE menu_id = (
         SELECT id FROM menu WHERE restaurant_id = $1
       )`,
            [restaurantId]
        );

        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Post route to add a new menu item
app.post("/menu-item", async (req, res) => {
    const { name, price, category, menu_id } = req.body;

    if (!name || !price || !category || !menu_id) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO menu_item (name, price, category, menu_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [name, price, category, menu_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Delete route to remove a menu item by ID
app.delete("/menu-item/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM menu_item WHERE id = $1 RETURNING *",
            [id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json({ message: "Deleted", data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Put route to update a menu item by ID
app.put("/menu-item/:id", async (req, res) => {
    const { id } = req.params;
    const { name, price, category } = req.body;

    try {
        const result = await pool.query(
            `UPDATE menu_item
       SET name = $1, price = $2, category = $3
       WHERE id = $4
       RETURNING *`,
            [name, price, category, id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});