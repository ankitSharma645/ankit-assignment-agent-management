const { validationResult } = require("express-validator")
const User = require("../models/User")

// Create new agent
exports.createAgent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() })
    }

    const { name, email, mobile, password } = req.body

    const existingAgent = await User.findOne({
      $or: [{ email }, { mobile }],
    })

    if (existingAgent) {
      return res.status(400).json({ message: "Agent already exists with this email or mobile number" })
    }

    const agent = new User({
      name,
      email,
      mobile,
      password,
      role: "agent",
      createdBy: req.user._id,
    })

    await agent.save()

    res.status(201).json({ message: "Agent created successfully", agent })
  } catch (error) {
    console.error("Create agent error:", error)
    res.status(500).json({ message: "Server error while creating agent" })
  }
}

// Get all agents
exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({
      createdBy: req.user._id,
      role: "agent",
    })
      .select("-password")
      .sort({ createdAt: -1 })

    res.json({ message: "Agents retrieved successfully", agents, count: agents.length })
  } catch (error) {
    console.error("Get agents error:", error)
    res.status(500).json({ message: "Server error while fetching agents" })
  }
}

// Get single agent
exports.getAgentById = async (req, res) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      role: "agent",
    }).select("-password")

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    res.json({ message: "Agent retrieved successfully", agent })
  } catch (error) {
    console.error("Get agent error:", error)
    res.status(500).json({ message: "Server error while fetching agent" })
  }
}

// Update agent
exports.updateAgent = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() })
    }

    const { name, email, mobile, isActive } = req.body

    const agent = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      role: "agent",
    })

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    if (email || mobile) {
      const duplicateAgent = await User.findOne({
        _id: { $ne: req.params.id },
        role: "agent",
        $or: [...(email ? [{ email }] : []), ...(mobile ? [{ mobile }] : [])],
      })

      if (duplicateAgent) {
        return res.status(400).json({ message: "Another agent already exists with this email or mobile number" })
      }
    }

    const updatedAgent = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(mobile && { mobile }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      { new: true, runValidators: true }
    ).select("-password")

    res.json({ message: "Agent updated successfully", agent: updatedAgent })
  } catch (error) {
    console.error("Update agent error:", error)
    res.status(500).json({ message: "Server error while updating agent" })
  }
}

// Delete agent
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      role: "agent",
    })

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" })
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("Delete agent error:", error)
    res.status(500).json({ message: "Server error while deleting agent" })
  }
}
