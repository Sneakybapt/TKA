import { Redis } from "@upstash/redis";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Connexion Upstash Redis via REST
const redis = new Redis({
  url: "https://workable-glider-46770.upstash.io",
  token: "AbayAAIjcDE1ZGJkYjg4Njg0MTI0N2IyYTQ2NTk4NGM5MGE0NDY1ZXAxMA"
});

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

const eliminationsEnAttente = {};
const server = http.createServer();
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

    socket.emit("reconnexion_ok", { code, joueurs });
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

    for (let i = 0; i < joueursMelanges.length; i++) {
      const joueur = joueursMelanges[i];
      const cible = joueursMelanges[(i + 1) % joueursMelanges.length];
      const mission = shuffledMissions[i % shuffledMissions.length] || "Mission secrète.";
      joueur.cible = cible.pseudo;
      joueur.mission = mission;
      await redis.set(`partie:${code}:${joueur.pseudo}`, joueur);
    }

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
  });

  socket.on("tentative_elimination", async ({ code, tueur, cible, message }) => {
    const cibleData = await redis.get(`partie:${code}:${cible}`);
    if (!cibleData) return;

    eliminationsEnAttente[cible] = { code, tueur, message };
    io.to(cibleData.id).emit("demande_validation", { tueur, message });
    console.log(`📤 Tentative envoyée à ${cible}`);
  });

  socket.on("validation_elimination", async ({ code, cible, tueur }) => {
    const cibleData = await redis.get(`partie:${code}:${cible}`);
    const tueurData = await redis.get(`partie:${code}:${tueur}`);
    if (!cibleData || !tueurData) return;

    tueurData.cible = cibleData.cible;
    tueurData.mission = cibleData.mission || "Mission secrète.";
    await redis.set(`partie:${code}:${tueur}`, tueurData);
    await redis.del(`partie:${code}:${cible}`);

    io.to(tueurData.id).emit("partie_lancee", {
      pseudo: tueurData.pseudo,
      cible: tueurData.cible,
      mission: tueurData.mission,
      code,
    });

    const keys = await redis.keys(`partie:${code}:*`);
    const joueursRestants = await Promise.all(keys.map(k => redis.get(k)));

    io.to(code).emit("mise_a_jour_joueurs", joueursRestants);
    console.log(`☠️ ${cible} éliminé par ${tueur}`);

    if (joueursRestants.length === 1) {
      const survivant = joueursRestants[0];
      io.to(survivant.id).emit("victoire");
      console.log(`🏆 ${survivant.pseudo} a gagné la partie ${code}`);
    }

    delete eliminationsEnAttente[cible];
  });

  socket.on("disconnect", async () => {
    const keys = await redis.keys("partie:*:*");
    for (const key of keys) {
      const joueur = await redis.get(key);
      if (!joueur) continue;
      if (joueur.id === socket.id) {
        await redis.del(key);
        const restants = await Promise.all(
          (await redis.keys(`partie:${joueur.code}:*`)).map(k => redis.get(k))
        );
        io.to(joueur.code).emit("mise_a_jour_joueurs", restants);
        console.log("🔌 Déconnecté :", socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serveur Socket.IO en ligne sur http://localhost:${PORT}`);
});
