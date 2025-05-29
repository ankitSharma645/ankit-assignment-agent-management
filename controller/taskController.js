const Task = require("../models/Task");

// @desc Get tasks for logged-in agent
const getTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { assignedTo: req.user._id };

    if (status) {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate("assignedBy", "name email")
      .populate("listId", "fileName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      message: "Tasks retrieved successfully",
      tasks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
};

// @desc Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "in_progress", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updateData = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("assignedBy", "name email")
      .populate("listId", "fileName");

    res.json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ message: "Server error while updating task" });
  }
};

// @desc Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { assignedTo: req.user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({
      message: "Task statistics retrieved successfully",
      stats: formattedStats,
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({ message: "Server error while fetching task statistics" });
  }
};

module.exports = {
  getTasks,
  updateTaskStatus,
  getTaskStats,
};
