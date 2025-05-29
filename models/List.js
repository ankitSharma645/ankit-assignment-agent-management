
const mongoose = require("mongoose")

const listItemSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
})

const listSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    totalItems: {
      type: Number,
      required: [true, "Total items count is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    distributions: [
      {
        agent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        items: [listItemSchema],
        itemCount: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("List", listSchema)
