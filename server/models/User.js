import mongoose from "mongoose";
import bcrypt from "bcrypt";

// 🎯 Schéma du joueur
const userSchema = new mongoose.Schema({
  pseudo: { type: String, required: true, unique: true },
  motdepasse: { type: String, required: true }
});

// 🔒 Hash du mot de passe avant l'enregistrement
userSchema.pre("save", async function (next) {
  if (!this.isModified("motdepasse")) return next();
  this.motdepasse = await bcrypt.hash(this.motdepasse, 10);
  next();
});

// Export du modèle
const User = mongoose.model("User", userSchema);
export default User;
