const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Please add the user name"],
    },
    email: {
      type: String,
      required: [true, "Please add the user email address"],
      unique: [true, "Email address already taken"],
    },
    password: {
      type: String,
      required: [true, "Please add the user password"],
    },
    imgUrl: {
      type: String, // Store Cloudinary URL
    },
    role: { type: String, enum: ["admin", "user"], required: true },
    deviceId: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
