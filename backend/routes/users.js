const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao buscar usuários"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO users (id, name, email)
      VALUES ($1, $2, $3)
      `,
      [id, name, email]
    );

    res.status(201).json({
      id,
      name,
      email
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao cadastrar usuário"
    });
  }
});

module.exports = router;