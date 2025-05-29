const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")
const xlsx = require("xlsx")
const List = require("../models/List")
const Task = require("../models/Task")
const User = require("../models/User")

// Parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const normalizedData = {}
        Object.keys(data).forEach((key) => {
          const k = key.toLowerCase().trim()
          if (k.includes("firstname") || k.includes("first_name") || k === "name")
            normalizedData.firstName = data[key]?.trim() || ""
          else if (k.includes("phone") || k.includes("mobile"))
            normalizedData.phone = data[key]?.trim() || ""
          else if (k.includes("notes") || k.includes("note"))
            normalizedData.notes = data[key]?.trim() || ""
        })
        if (normalizedData.firstName && normalizedData.phone) results.push(normalizedData)
      })
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

// Parse Excel
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath)
  const sheet = workbook.SheetNames[0]
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet])
  const results = []

  data.forEach((row) => {
    const normalizedData = {}
    Object.keys(row).forEach((key) => {
      const k = key.toLowerCase().trim()
      if (k.includes("firstname") || k.includes("first_name") || k === "name")
        normalizedData.firstName = row[key]?.toString().trim() || ""
      else if (k.includes("phone") || k.includes("mobile"))
        normalizedData.phone = row[key]?.toString().trim() || ""
      else if (k.includes("notes") || k.includes("note"))
        normalizedData.notes = row[key]?.toString().trim() || ""
    })
    if (normalizedData.firstName && normalizedData.phone) results.push(normalizedData)
  })
  return results
}

// Distribute data among 5 agents
const distributeItems = (items, agents) => {
  const selectedAgents = agents.slice(0, 5)
  if (selectedAgents.length < 5) throw new Error("Need at least 5 active agents")

  const results = []
  const each = Math.floor(items.length / 5)
  const extra = items.length % 5
  let idx = 0

  selectedAgents.forEach((agent, i) => {
    const count = each + (i < extra ? 1 : 0)
    const chunk = items.slice(idx, idx + count)
    results.push({ agent: agent._id, items: chunk, itemCount: chunk.length })
    idx += count
  })

  return results
}

// Controller: Upload List
exports.uploadList = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" })

    const filePath = req.file.path
    const ext = path.extname(req.file.originalname).toLowerCase()

    const agents = await User.find({ createdBy: req.user._id, role: "agent", isActive: true })
    if (agents.length < 5) {
      fs.unlinkSync(filePath)
      return res.status(400).json({ message: `Need at least 5 active agents. Found: ${agents.length}` })
    }

    let parsedData = []
    if (ext === ".csv") parsedData = await parseCSV(filePath)
    else if (ext === ".xlsx" || ext === ".xls") parsedData = parseExcel(filePath)

    fs.unlinkSync(filePath)
    if (parsedData.length === 0) {
      return res.status(400).json({ message: "No valid data found in file" })
    }

    const distributions = distributeItems(parsedData, agents)

    const list = await new List({
      fileName: req.file.originalname,
      totalItems: parsedData.length,
      uploadedBy: req.user._id,
      distributions,
      status: "completed",
    }).save()

    for (const dist of distributions) {
      const tasks = dist.items.map((item) => ({
        firstName: item.firstName,
        phone: item.phone,
        notes: item.notes,
        assignedTo: dist.agent,
        assignedBy: req.user._id,
        listId: list._id,
        status: "pending",
      }))
      await Task.insertMany(tasks)
      await User.findByIdAndUpdate(dist.agent, { $inc: { assignedTasks: dist.itemCount } })
    }

    const populated = await List.findById(list._id)
      .populate("distributions.agent", "name email")
      .populate("uploadedBy", "name email")

    res.status(201).json({ message: "File uploaded and distributed", list: populated })
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
    res.status(500).json({ message: "Error processing file", error: error.message })
  }
}

// Get all lists
exports.getAllLists = async (req, res) => {
  try {
    const lists = await List.find({ uploadedBy: req.user._id })
      .populate("distributions.agent", "name email")
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })

    res.json({ message: "Lists retrieved", lists, count: lists.length })
  } catch (error) {
    res.status(500).json({ message: "Error fetching lists" })
  }
}
// Get single list with task statuses
exports.getListById = async (req, res) => {
  try {
    // Get the list with populated agents
    const list = await List.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    })
      .populate("distributions.agent", "name email mobile")
      .populate("uploadedBy", "name email")
      .lean(); // Convert to plain JS object

    if (!list) return res.status(404).json({ message: "List not found" });

    // Get all tasks for this list
    const tasks = await Task.find({ listId: list._id })
      .select('assignedTo status firstName phone notes createdAt updatedAt')
      .lean();

    // Create a map of agentId to tasks
    const tasksByAgent = tasks.reduce((acc, task) => {
      const agentId = task.assignedTo.toString();
      if (!acc[agentId]) {
        acc[agentId] = [];
      }
      acc[agentId].push(task);
      return acc;
    }, {});

    // Create status summary for each agent
    const statusSummaryByAgent = tasks.reduce((acc, task) => {
      const agentId = task.assignedTo.toString();
      if (!acc[agentId]) {
        acc[agentId] = {};
      }
      acc[agentId][task.status] = (acc[agentId][task.status] || 0) + 1;
      return acc;
    }, {});

    // Transform distributions to include tasks and status summary
    const transformedDistributions = list.distributions.map(dist => {
      const agentId = dist.agent._id.toString();
      return {
        ...dist,
        tasks: tasksByAgent[agentId] || [],
        statusSummary: statusSummaryByAgent[agentId] || {}
      };
    });

    // Create the final response object
    const response = {
      ...list,
      distributions: transformedDistributions
    };

    res.json({ 
      message: "List retrieved", 
      list: response 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching list", error: error.message });
  }
};
// Delete list
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, uploadedBy: req.user._id })
    if (!list) return res.status(404).json({ message: "List not found" })

    await Task.deleteMany({ listId: list._id })
    for (const dist of list.distributions) {
      await User.findByIdAndUpdate(dist.agent, { $inc: { assignedTasks: -dist.itemCount } })
    }
    await List.findByIdAndDelete(req.params.id)

    res.json({ message: "List deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting list" })
  }
}
