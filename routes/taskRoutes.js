const express = require("express");
const {
  getTasks,
  updateTaskStatus,
  getTaskStats,
} = require("../controller/taskController");
const { agentAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/tasks
router.get("/", agentAuth, getTasks);

// @route   PUT /api/tasks/:id/status
router.put("/:id/status", agentAuth, updateTaskStatus);

// @route   GET /api/tasks/stats
router.get("/stats", agentAuth, getTaskStats);

module.exports = router;
