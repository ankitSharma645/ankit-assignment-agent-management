const express = require("express")
const { body } = require("express-validator")
const { adminAuth } = require("../middleware/authMiddleware")
const agentController = require("../controller/agentController")

const router = express.Router()

// POST /api/agents
router.post(
  "/",
  adminAuth,
  [
    body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("mobile").matches(/^\+[1-9]\d{1,14}$/).withMessage("Valid mobile with country code required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  agentController.createAgent
)

// GET /api/agents
router.get("/", adminAuth, agentController.getAgents)

// GET /api/agents/:id
router.get("/:id", adminAuth, agentController.getAgentById)

// PUT /api/agents/:id
router.put(
  "/:id",
  adminAuth,
  [
    body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("mobile").optional().matches(/^\+[1-9]\d{1,14}$/).withMessage("Enter valid mobile number with code"),
  ],
  agentController.updateAgent
)

// DELETE /api/agents/:id
router.delete("/:id", adminAuth, agentController.deleteAgent)

module.exports = router
