// routes/agentRoutes.js
const express = require("express");
const router = express.Router();
const { askAzureAgent } = require("../controllers/azureAgentController");

router.post("/ask-agent", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await askAzureAgent(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
