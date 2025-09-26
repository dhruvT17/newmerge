const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Credentials",
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contact_number: { type: String },
    address: { type: String },
    skills: [{ type: String }],
    profile_picture: {
      url: { type: String }, // ✅ Profile picture URL is now required
      upload_date: { type: Date, default: Date.now },
    },
    preferences: {
      languages: [{ type: String }],
    },
    additional_fields: { type: Map, of: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
