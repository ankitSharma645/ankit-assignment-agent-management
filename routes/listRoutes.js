const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { adminAuth } = require("../middleware/authMiddleware")
const listController = require("../controller/listController")

const router = express.Router()

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const allowed = [".csv", ".xlsx", ".xls"]
  cb(null, allowed.includes(ext))
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// Routes
router.post("/upload", adminAuth, upload.single("file"), listController.uploadList)
router.get("/", adminAuth, listController.getAllLists)
router.get("/:id", adminAuth, listController.getListById)
router.delete("/:id", adminAuth, listController.deleteList)

module.exports = router
