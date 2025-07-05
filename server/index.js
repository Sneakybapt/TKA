const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const missionsPath = path.join(__dirname, "missions.json");

// 🧠 Chargement des missions
let missions = [];
try {
  const data = fs.readFileSync(missionsPath, "utf-8");
  missions = JSON.parse(data);
  console.log(`✅ ${missions.length} missions chargées`);
} catch (err) {
  console.error("❌ Impossible de charger les missions :", err.message);
}

// 🧠 Mémoire des parties
const parties = {};
const eliminationsEnAttente = {};

const server = http.createServer(); // ⛔️ Pas d'app Express ici
const io = new Server(server, {
  cors: {
    origin: "*", // ✅ Permet les appels depuis le frontend
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Connexion :", socket.id);

  socket.on("creer_partie", ({ pseudo }) => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    parties[code] = [{ id: socket.id, pseudo }];
    socket.join(code);
    socket.emit("partie_creee", { code, joueurs: parties[code] });
    console.log(`🎲 Partie ${code} créée par ${pseudo}`);
  });

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

  socket.on("lancer_partie", (code) => {
    const joueurs = parties[code];
    if (!joueurs || joueurs.length < 2) {
      io.to(code).emit("erreur", "Il faut au moins 2 joueurs.");
      return;
    }

  socket.on("reconnexion", ({ code, pseudo }) => {
    const joueurs = parties[code];
    if (!joueurs) {
      socket.emit("erreur", "Partie introuvable.");
      return;
    }

    const joueur = joueurs.find(j => j.pseudo === pseudo);
    if (!joueur) {
      socket.emit("erreur", "Pseudo non reconnu.");
      return;
    }

    const tentative = eliminationsEnAttente[pseudo];
    if (tentative) {
      socket.emit("demande_validation", {
        tueur: tentative.tueur,
        message: tentative.message
      });
    }


    // 🔁 Mise à jour du nouvel ID
    joueur.id = socket.id;
    socket.join(code);

    // ✅ Mise à jour du lobby
    io.to(code).emit("mise_a_jour_joueurs", joueurs);
    socket.emit("reconnexion_ok", { code, joueurs });
    console.log(`🔄 ${pseudo} reconnecté à la partie ${code}`);
  });

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

  socket.on("tentative_elimination", ({ code, tueur, cible, message }) => {
    const joueurs = parties[code];
    if (!joueurs) return;

    const cibleData = joueurs.find(j => j.pseudo === cible);
    if (!cibleData) return;

    eliminationsEnAttente[cible] = { code, tueur, message };
    io.to(cibleData.id).emit("demande_validation", { tueur, message });
    console.log(`📤 Tentative envoyée à ${cible}`);
  });

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

  socket.on("disconnect", () => {
    for (const code in parties) {
      parties[code] = parties[code].filter(j => j.id !== socket.id);
      io.to(code).emit("mise_a_jour_joueurs", parties[code]);
    }
    console.log("🔌 Déconnecté :", socket.id);
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur Socket.IO en ligne sur http://localhost:${PORT}`);
});
