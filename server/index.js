import { Redis } from "@upstash/redis";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "./models/User.js";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import Game from "./models/Game.js"; 

const app = express();

const whitelist = [
  "https://the-killer-game-9hvh.onrender.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ CORS bloqué : " + origin));
    }
  },
  credentials: true
}));


// ✅ Middleware JSON moderne
app.use(express.json());


app.post("/api/inscription", async (req, res) => {
  const { pseudo, motdepasse } = req.body;

  try {
    const existingUser = await User.findOne({ pseudo });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: "Pseudo déjà pris" });
    }

    const hashedPassword = await bcrypt.hash(motdepasse, 10); // ✅ hash sécurisé
    console.log("🔐 Mot de passe hashé :", hashedPassword);
    const newUser = new User({ pseudo, motdepasse: hashedPassword });
    console.log("✅ Utilisateur enregistré :", newUser);

    console.log("📨 Sauvegarde du nouvel utilisateur :", pseudo);
    await newUser.save();
    const userEnBase = await User.findById(newUser._id);
    console.log("🔍 Vérification post-save :", userEnBase);
    console.log("✅ Enregistrement terminé");

    res.json({ ok: true, message: "Profil créé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription :", error);
    res.status(500).json({ ok: false, message: "Erreur serveur" });
  }
});

app.post("/api/connexion", async (req, res) => {
  const { pseudo, motdepasse } = req.body;

  try {
    console.log("🔍 Connexion reçue :", { pseudo, motdepasse });

    const user = await User.findOne({ pseudo });
    if (!user) {
      console.log("❌ Profil introuvable");
      return res.status(404).json({ ok: false, message: "Profil introuvable" });
    }

    console.log("🔐 Mot de passe en base :", user.motdepasse);

    const match = await bcrypt.compare(motdepasse, user.motdepasse);
    console.log("✅ Résultat comparaison :", match);

    if (!match) {
      return res.status(401).json({ ok: false, message: "Mot de passe incorrect" });
    }

    console.log(`✅ Connexion réussie pour ${pseudo}`);
    res.json({ ok: true, message: "Connexion réussie" });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error);
    res.status(500).json({ ok: false, message: "Erreur serveur" });
  }
});

app.post("/api/enregistrer-partie", async (req, res) => {
  const { code, classement } = req.body;
    console.log("📨 Route appelée !");
    console.log("📦 Données reçues :", req.body);
    console.log("📨 Données reçues :", { code, classement });

  if (!Array.isArray(classement) || classement.length === 0) {
    return res.status(400).json({ ok: false, message: "Classement invalide" });
  }

  try {
    const nouvellePartie = new Game({
      code,
      joueurs: classement.map(joueur => ({
        pseudo: joueur.pseudo,
        position: joueur.position
      }))
    });

    await nouvellePartie.save();
    console.log("✅ Partie enregistrée dans Mongo :", nouvellePartie);

    res.json({ ok: true, message: "Partie enregistrée" });
  } catch (error) {
    console.error("❌ Erreur enregistrement partie :", error);
    res.status(500).json({ ok: false, message: "Erreur serveur" });
  }
});


app.get("/api/profil-stats", async (req, res) => {
  const pseudo = req.query.pseudo;

  try {
    const parties = await Game.find({ "joueurs.pseudo": pseudo });

    const nbParties = parties.length;
    const nbVictoires = parties.filter(p =>
      p.joueurs.find(j => j.pseudo === pseudo && j.position === 1)
    ).length;

    res.json({ nbParties, nbVictoires });
  } catch (error) {
    console.error("❌ Erreur stats profil :", error);
    res.status(500).json({ ok: false, message: "Erreur serveur" });
  }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const MONGO_URI = "mongodb+srv://baptistegaquiere:ivnyXAeYWdng2HwY@clusterthekiller.vclykcy.mongodb.net/Killergame?retryWrites=true&w=majority&appName=ClusterTheKiller";


mongoose.connect(MONGO_URI)
.then(() => console.log("✅ Connexion à MongoDB réussie"))
.catch(err => console.error("❌ Erreur MongoDB :", err));


const redis = new Redis({
  url: "https://workable-glider-46770.upstash.io",
  token: "AbayAAIjcDE1ZGJkYjg4Njg0MTI0N2IyYTQ2NTk4NGM5MGE0NDY1ZXAxMA"
});

const missionsPath = path.join(__dirname, "missions.json");

let missions = [];
try {
  const data = fs.readFileSync(missionsPath, "utf-8");
  missions = JSON.parse(data);
  console.log(`✅ ${missions.length} missions chargées`);
} catch (err) {
  console.error("❌ Impossible de charger les missions :", err.message);
}

const eliminationsEnAttente = {};
const server = http.createServer(app); // Express + Socket.IO

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Connexion :", socket.id);

  socket.on("creer_partie", async ({ pseudo }) => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const joueur = { id: socket.id, pseudo, code };
    await redis.set(`partie:${code}:${pseudo}`, joueur);
    socket.join(code);
    socket.emit("partie_creee", { code, joueurs: [joueur] });
    console.log(`🎲 Partie ${code} créée par ${pseudo}`);
  });

  socket.on("rejoindre_partie", async ({ code, pseudo }) => {
    const joueur = { id: socket.id, pseudo, code };
    await redis.set(`partie:${code}:${pseudo}`, joueur);
    socket.join(code);
    socket.emit("confirmation_rejoindre", { code, pseudo });

    const keys = await redis.keys(`partie:${code}:*`);
    const joueurs = await Promise.all(keys.map(k => redis.get(k)));

    socket.emit("mise_a_jour_joueurs", joueurs);
    io.to(code).emit("mise_a_jour_joueurs", joueurs);
    console.log(`➡️ ${pseudo} a rejoint la partie ${code}`);
  });

  socket.on("reconnexion", async ({ code, pseudo }) => {
    const joueur = await redis.get(`partie:${code}:${pseudo}`);
    if (!joueur) {
      socket.emit("erreur", "Pseudo non reconnu.");
      return;
    }

    joueur.id = socket.id;
    await redis.set(`partie:${code}:${pseudo}`, joueur);
    socket.join(code);

    if (joueur.mission && joueur.cible) {
      socket.emit("partie_lancee", {
        pseudo: joueur.pseudo,
        code,
        cible: joueur.cible,
        mission: joueur.mission,
      });
    }

    const tentative = eliminationsEnAttente[pseudo];
    if (tentative) {
      socket.emit("demande_validation", {
        tueur: tentative.tueur,
        message: tentative.message,
      });
    }

    const keys = await redis.keys(`partie:${code}:*`);
    const joueurs = await Promise.all(keys.map(k => redis.get(k)));

    // ✅ Envoi enrichi
    socket.emit("reconnexion_ok", {
      pseudo: joueur.pseudo,
      code,
      mission: joueur.mission,
      cible: joueur.cible,
      joueurs
    });

    io.to(code).emit("mise_a_jour_joueurs", joueurs);
    console.log(`🔄 ${pseudo} reconnecté à la partie ${code}`);
  });

  socket.on("lancer_partie", async (code) => {
    const keys = await redis.keys(`partie:${code}:*`);
    const joueurs = await Promise.all(keys.map(k => redis.get(k)));

    if (!joueurs || joueurs.length < 2) {
      io.to(code).emit("erreur", "Il faut au moins 2 joueurs.");
      return;
    }

    const joueursMelanges = [...joueurs].sort(() => 0.5 - Math.random());
    const shuffledMissions = [...missions].sort(() => 0.5 - Math.random());

    // 💾 Répartition des missions et cibles
    for (let i = 0; i < joueursMelanges.length; i++) {
      const joueur = joueursMelanges[i];
      const cible = joueursMelanges[(i + 1) % joueursMelanges.length];
      const mission = shuffledMissions[i % shuffledMissions.length] || "Mission secrète.";

      // 👮 Vérification anti auto-ciblage (même si circulaire l’évite déjà)
      if (joueur.pseudo === cible.pseudo) {
        const autre = joueursMelanges.find(j => j.pseudo !== joueur.pseudo);
        joueur.cible = autre?.pseudo || cible.pseudo;
      } else {
        joueur.cible = cible.pseudo;
      }

      joueur.mission = mission;
      await redis.set(`partie:${code}:${joueur.pseudo}`, joueur);
    }

    // 🔒 Mise en pause de la phase d’élimination
    await redis.set(`statut:${code}`, "enPause");

    const joueursFinal = await Promise.all(keys.map(k => redis.get(k)));
    joueursFinal.forEach((j) => {
      io.to(j.id).emit("partie_lancee", {
        pseudo: j.pseudo,
        cible: j.cible,
        mission: j.mission,
        code,
      });
    });

    console.log(`🚀 Partie ${code} lancée avec ${joueurs.length} joueurs`);

    // ✅ Activation de la phase d’élimination après 5 sec
    setTimeout(async () => {
      await redis.set(`statut:${code}`, "enCours");
      io.to(code).emit("autorisation_elimination");
      console.log(`🗡️ Phase d’élimination activée pour ${code}`);
    }, 5000);
  });


  socket.on("tentative_elimination", async ({ code, tueur, cible, message }) => {
    const statut = await redis.get(`statut:${code}`);
    if (statut !== "enCours") {
      socket.emit("erreur", "La phase d'élimination n'est pas encore active.");
      return;
    }

    const cibleData = await redis.get(`partie:${code}:${cible}`);
    if (!cibleData) return;

    eliminationsEnAttente[cible] = { code, tueur, message };
    io.to(cibleData.id).emit("demande_validation", { tueur, message });
    console.log(`📤 Tentative envoyée à ${cible}`);
  });


    socket.on("validation_elimination", async ({ code, cible, tueur }) => {
      console.log("📡 validation_elimination reçue :", { code, cible, tueur });

      // ✅ Marquer la cible comme éliminée
      await redis.rpush(`elimines:${code}`, cible);

      // ✅ Supprimer la cible du tueur
      const tueurData = await redis.get(`partie:${code}:${tueur}`);
      if (!tueurData) return;
      const tueurObj = JSON.parse(tueurData);
      tueurObj.cible = null;
      tueurObj.mission = "Nouvelle cible en attente";
      await redis.set(`partie:${code}:${tueur}`, JSON.stringify(tueurObj));

      // ✅ Vérifier combien de joueurs sont encore en vie
      const joueursKeys = await redis.keys(`partie:${code}:*`);
      const vivants = [];

      for (const key of joueursKeys) {
        const joueur = JSON.parse(await redis.get(key));
        const estElimine = await redis.lrange(`elimines:${code}`, 0, -1);
        if (!estElimine.includes(joueur.pseudo)) {
          vivants.push(joueur);
        }
      }

      console.log("🧍 Survivants restants :", vivants.map(j => j.pseudo));

      if (vivants.length === 1) {
        const gagnant = vivants[0];

        // ✅ Construire le classement
        const elimines = await redis.lrange(`elimines:${code}`, 0, -1);
        const classement = elimines.map((pseudo, index) => ({
          pseudo,
          position: elimines.length - index + 1
        }));
        classement.push({ pseudo: gagnant.pseudo, position: 1 });

        // ✅ Émettre le classement final
        io.to(gagnant.id).emit("classement_final", classement);
        console.log(`🏆 ${gagnant.pseudo} a gagné la partie ${code}`);
      }
    });



  socket.on("demande_survivants", async ({ code }) => {
    const keys = await redis.keys(`partie:${code}:*`);
    const tous = await Promise.all(keys.map(k => redis.get(k)));

    const vivants = tous.filter(joueur => !joueur.elimine);

    io.to(socket.id).emit("liste_survivants", vivants.map(j => ({
      pseudo: j.pseudo,
      cible: j.cible,
      mission: j.mission
    })));

    console.log(`👻 Survivants envoyés à ${socket.id} pour la partie ${code}`);
  });


  socket.on("demande_nouvelle_mission", async ({ pseudo, code }) => {
    const joueur = await redis.get(`partie:${code}:${pseudo}`);
    if (!joueur) return;

    const compteurCle = `mission_changees:${code}:${pseudo}`;
    const dejaChangees = await redis.get(compteurCle) || 0;

    if (parseInt(dejaChangees) >= 2) {
      io.to(joueur.id).emit("erreur", "Tu as déjà changé ta mission 2 fois.");
      return;
    }

    const nouvelles = [...missions].sort(() => 0.5 - Math.random());
    const nouvelleMission = nouvelles[0] || "Mission alternative.";
    joueur.mission = nouvelleMission;

    await redis.set(`partie:${code}:${pseudo}`, joueur);
    await redis.set(compteurCle, parseInt(dejaChangees) + 1);

    io.to(joueur.id).emit("nouvelle_mission", { mission: nouvelleMission });
    console.log(`🔁 Nouvelle mission envoyée à ${pseudo}`);
  });

  socket.on("disconnect", async () => {
    const keys = await redis.keys("partie:*:*");

    for (const key of keys) {
      const joueur = await redis.get(key);
      if (!joueur) continue;

      if (joueur.id === socket.id) {
        console.log(`⚠️ Déconnexion de ${joueur.pseudo} (${joueur.code})`);

        // ✅ Mise en veille sans suppression
        joueur.id = null;
        await redis.set(key, joueur);

        const restants = await Promise.all(
          (await redis.keys(`partie:${joueur.code}:*`)).map(k => redis.get(k))
        );

        io.to(joueur.code).emit("mise_a_jour_joueurs", restants);
      }
    }
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur Socket.IO en ligne sur http://localhost:${PORT}`);
});