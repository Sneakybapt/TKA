import mongoose from "mongoose";

const joueurSchema = new mongoose.Schema({
  pseudo: String,
  position: Number // 1 = gagnant, 2 = deuxième, ..., N = dernier
});

const gameSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  joueurs: [joueurSchema]
});

export default mongoose.model("Game", gameSchema);
