import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true, unique: true },
  motdepasse: { type: String, required: true },
  nbParties: { type: Number, default: 0 },
  positions: { type: [String], default: [] }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("motdepasse")) return next();
  this.motdepasse = await bcrypt.hash(this.motdepasse, 10);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
