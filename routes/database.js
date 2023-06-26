import * as db from "../bin/sqlite.js";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  let data = await db.getResults();
  console.log(data);
  res.json(data);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const data = await db.getUserById(id);
  res.json(data);
})



router.post("/", async (req, res) => {
  let { username, score } = req.body;
  let id = await db.postResults(username, score);
  console.log(id);
  if (id) {
    res.status(201).json({ id: id });
  } else {
    res.sendStatus(500);
  }
});

router.put("/", async (req, res) => {
  let { id, username } = req.body;
  let result = await db.updateResults(id, username);
  if (result > 0) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
