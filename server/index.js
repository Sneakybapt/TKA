const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const staticPath = path.join(__dirname, "dist"); // ✅ Serve React frontend
const missionsPath = path.join(__dirname, "missions.json");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static(staticPath)); // ✅ Serves /dist files

// 🧠 Chargement des missions
let missions = [];
try {
  const data = fs.readFileSync(missionsPath, "utf-8");
  missions = JSON.parse(data);
  console.log(`✅ ${missions.length} missions chargées`);
} catch (err) {
  console.error("❌ Impossible de charger les missions :", err.message);
}

// ✅ Catch-all pour React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// 🧠 Mémoire des parties
const parties = {};
const eliminationsEnAttente = {};

io.on("connection", (socket) => {
  console.log("🔌 Connexion :", socket.id);

  // 👉 Créer partie
  socket.on("creer_partie", ({ pseudo }) => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    parties[code] = [{ id: socket.id, pseudo }];
    socket.join(code);
    socket.emit("partie_creee", { code, joueurs: parties[code] });
    console.log(`🎲 Partie ${code} créée par ${pseudo}`);
  });

  // 👉 Rejoindre partie
  socket.on("rejoindre_partie", ({ code, pseudo }) => {
    if (parties[code]) {
      parties[code].push({ id: socket.id, pseudo });
      socket.join(code);
      io.to(code).emit("mise_a_jour_joueurs", parties[code]);
      console.log(`➡️ ${pseudo} a rejoint la partie ${code}`);
    } else {
      socket.emit("erreur", "Code de partie invalide");
    }
  });

  // 👉 Lancer partie
  socket.on("lancer_partie", (code) => {
    const joueurs = parties[code];
    if (!joueurs || joueurs.length < 2) {
      io.to(code).emit("erreur", "Il faut au moins 2 joueurs.");
      return;
    }

    const joueursMelanges = [...joueurs].sort(() => 0.5 - Math.random());
    const shuffledMissions = [...missions].sort(() => 0.5 - Math.random());

    const donneesJoueurs = joueursMelanges.map((joueur, index) => {
      const cible = joueursMelanges[(index + 1) % joueursMelanges.length];
      const mission = shuffledMissions[index % shuffledMissions.length] || "Mission secrète.";
      return {
        id: joueur.id,
        pseudo: joueur.pseudo,
        cible: cible.pseudo,
        mission,
      };
    });

    parties[code] = donneesJoueurs;

    donneesJoueurs.forEach((j) => {
      io.to(j.id).emit("partie_lancee", {
        pseudo: j.pseudo,
        cible: j.cible,
        mission: j.mission,
        code,
      });
    });

    console.log(`🚀 Partie ${code} lancée avec ${joueurs.length} joueurs`);
  });

  // 👉 Tentative d’élimination
  socket.on("tentative_elimination", ({ code, tueur, cible, message }) => {
    const joueurs = parties[code];
    if (!joueurs) return;

    const cibleData = joueurs.find(j => j.pseudo === cible);
    if (!cibleData) return;

    eliminationsEnAttente[cible] = { code, tueur, message };
    io.to(cibleData.id).emit("demande_validation", { tueur, message });
    console.log(`📤 Tentative envoyée à ${cible}`);
  });

  // 👉 Validation d’élimination
  socket.on("validation_elimination", ({ code, cible, tueur }) => {
    const joueurs = parties[code];
    if (!joueurs) return;

    const cibleData = joueurs.find(j => j.pseudo === cible);
    const tueurData = joueurs.find(j => j.pseudo === tueur);
    if (!cibleData || !tueurData) return;

    const nouvelleCible = cibleData.cible;
    const nouvelleMission = cibleData.mission || "Mission secrète.";
    const nouvelleListe = joueurs.filter(j => j.pseudo !== cible);

    tueurData.cible = nouvelleCible;
    tueurData.mission = nouvelleMission;
    parties[code] = nouvelleListe;

    io.to(tueurData.id).emit("partie_lancee", {
      pseudo: tueurData.pseudo,
      cible: nouvelleCible,
      mission: nouvelleMission,
      code,
    });

    io.to(code).emit("mise_a_jour_joueurs", nouvelleListe);
    console.log(`☠️ ${cible} éliminé par ${tueur}`);

    if (nouvelleListe.length === 1) {
      const survivant = nouvelleListe[0];
      io.to(survivant.id).emit("victoire");
      console.log(`🏆 ${survivant.pseudo} a gagné la partie ${code}`);
    }

    delete eliminationsEnAttente[cible];
  });

  // 👉 Déconnexion
  socket.on("disconnect", () => {
    for (const code in parties) {
      parties[code] = parties[code].filter(j => j.id !== socket.id);
      io.to(code).emit("mise_a_jour_joueurs", parties[code]);
    }
    console.log("🔌 Déconnecté :", socket.id);
  });
});

const PORT = process.env.PORT || 3000; // ✅ Compatible Render
server.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
