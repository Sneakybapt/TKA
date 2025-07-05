const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const staticPath = path.join(__dirname, "dist");


const app = express();
const server = http.createServer(app);

const missionsPath = path.join(__dirname, "missions.json");
let missions = [];

try {
  const data = fs.readFileSync(missionsPath, "utf-8");
  missions = JSON.parse(data);
  console.log(`✅ ${missions.length} missions chargées`);
} catch (err) {
  console.error("❌ Impossible de charger les missions :", err.message);
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.static(staticPath));
app.get("/", (req, res) => {
  res.send("Serveur Socket.IO en ligne !");
});

// Parties en mémoire
const parties = {};

io.on("connection", (socket) => {
  console.log("🔌 Nouvelle connexion :", socket.id);

  // Création de partie
  socket.on("creer_partie", ({ pseudo }) => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    parties[code] = [{ id: socket.id, pseudo }];
    socket.join(code);
    console.log("Joueurs envoyés :", parties[code]);
    socket.emit("partie_creee", { code, joueurs: parties[code] });
    console.log(`🎲 Partie ${code} créée par ${pseudo}`);
  });

  // Rejoindre une partie
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

  // Lancer la partie
  socket.on("lancer_partie", (code) => {
    const joueurs = parties[code];
    if (!joueurs || joueurs.length < 2) {
      io.to(code).emit("erreur", "Il faut au moins 2 joueurs pour lancer la partie.");
      return;
    }

    // 👉 Mélange des joueurs pour que la boucle soit aléatoire
    const joueursMelanges = [...joueurs].sort(() => 0.5 - Math.random());

    // Tirage aléatoire de missions
    const shuffledMissions = [...missions].sort(() => 0.5 - Math.random());

    // 👉 Attribution des cibles et missions sur la liste mélangée
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
    
    // ⬅️ Mise à jour des données en mémoire
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

  // ➕ Enregistrement temporaire des tentatives d’élimination
const eliminationsEnAttente = {};

socket.on("tentative_elimination", ({ code, tueur, cible, message }) => {
  const joueurs = parties[code];
  if (!joueurs) return;

  const cibleData = joueurs.find(j => j.pseudo === cible);
  if (!cibleData) return;

  // On stocke la tentative en attente
  eliminationsEnAttente[cible] = { code, tueur, message };

  // On notifie la cible
  io.to(cibleData.id).emit("demande_validation", { tueur, message });
  console.log(`📤 Tentative envoyée à ${cible} (id: ${cibleData.id})`);

});

socket.on("validation_elimination", ({ code, cible, tueur }) => {
  const joueurs = parties[code];
  if (!joueurs) return;

  const cibleData = joueurs.find(j => j.pseudo === cible);
  const tueurData = joueurs.find(j => j.pseudo === tueur);
  if (!cibleData || !tueurData) return;
  console.log("🎯 Victime :", cibleData);
  console.log("🔍 Tueur trouvé :", tueurData);

  // 👉 Récupérer la cible AVANT suppression
  const nouvelleCible = cibleData.cible;

  // 👉 Supprimer la victime
  const nouvelleListe = joueurs.filter(j => j.pseudo !== cible);
  parties[code] = nouvelleListe;

  // 👉 Réattribuer la cible au tueur
  tueurData.cible = nouvelleCible;

  // 👉 Récupérer la mission de la cible
  const nouvelleMission = cibleData.mission || "Nouvelle mission secrète.";

  // 👉 Réattribuer la mission au tueur
  tueurData.mission = nouvelleMission;

  // 👉 Envoyer au tueur sa nouvelle cible + mission
  console.log(`🚀 Envoi mise à jour à ${tueurData.pseudo} (id: ${tueurData.id}) ➡️ cible: ${nouvelleCible}, mission: ${nouvelleMission}`);
  io.to(tueurData.id).emit("partie_lancee", {
    pseudo: tueurData.pseudo,
    cible: nouvelleCible,
    mission: nouvelleMission,
    code,
  });

  // 👉 Mise à jour du salon
  io.to(code).emit("mise_a_jour_joueurs", nouvelleListe);
  console.log(`☠️ ${cible} a été éliminé par ${tueur}`);

  // 👉 Fin de partie ?
  if (nouvelleListe.length === 1) {
    const survivant = nouvelleListe[0];
    io.to(survivant.id).emit("victoire");
    console.log(`🏆 ${survivant.pseudo} remporte la partie ${code}`);
  }

  // 👉 Nettoyage
  delete eliminationsEnAttente[cible];
});



  // Déconnexion
  socket.on("disconnect", () => {
    for (const code in parties) {
      parties[code] = parties[code].filter((j) => j.id !== socket.id);
      io.to(code).emit("mise_a_jour_joueurs", parties[code]);
    }
    console.log("🔌 Déconnexion :", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});
