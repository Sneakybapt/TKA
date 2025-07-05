import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import socket from "../socket";

interface NotificationData {
  tueur: string;
  message: string;
}


export default function Jeu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pseudo, code } = location.state || {};

  const [cibleActuelle, setCibleActuelle] = useState(location.state?.cible || "");
  const [missionActuelle, setMissionActuelle] = useState(location.state?.mission || "");
  const [modeValidation, setModeValidation] = useState(false);
  const [texteMission, setTexteMission] = useState("");
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [infos, setInfos] = useState<{pseudo: string; code: string; mission: string; cible: string;} | null>(null);

useEffect(() => {
  const pseudo = localStorage.getItem("tka_pseudo");
  const code = localStorage.getItem("tka_code");
  const mission = localStorage.getItem("tka_mission");
  const cible = localStorage.getItem("tka_cible");

  if (pseudo && code && mission && cible) {
    setInfos({ pseudo, code, mission, cible });

    // 🔁 Demande au serveur de rejouer l’état si besoin
    socket.emit("reconnexion", { pseudo, code });
  }
}, []);

  useEffect(() => {
    socket.on("demande_validation", ({ tueur, message }) => {
      console.log("✅ Événement reçu : demande_validation");
      setNotification({ tueur, message });
    });

    socket.on("partie_lancee", ({ pseudo: newPseudo, cible: newCible, mission: newMission }) => {
    console.log("🛬 Mise à jour reçue !");
    console.log("👉 Nouveau pseudo :", newPseudo);
    console.log("👉 Nouvelle cible :", newCible);
    console.log("👉 Nouvelle mission :", newMission);
      setCibleActuelle(newCible);
      setMissionActuelle(newMission);
    });

    socket.on("victoire", () => {
      console.log("🏆 Victoire reçue !");
      navigate("/victoire");
});


    return () => {
      socket.off("demande_validation");
      socket.off("partie_lancee");
      socket.off("victoire");
    };
  }, [pseudo, code, navigate]);

  const handleEnvoyerMission = () => {
    if (texteMission.trim() === "") {
      alert("Merci de décrire comment tu as accompli ta mission 😇");
      return;
    }

    socket.emit("tentative_elimination", {
      code,
      tueur: pseudo,
      cible: cibleActuelle,
      message: texteMission.trim(),
    });

    setModeValidation(false);
    setTexteMission("");
    alert("Mission envoyée à ta cible. En attente de sa validation 👀");
  };

  const handleValidationElimination = () => {
    if (!notification) return;

    socket.emit("validation_elimination", {
      code,
      cible: pseudo,
      tueur: notification.tueur,
    });

    setNotification(null);
    navigate("/");
  };

  if (!pseudo || !cibleActuelle || !code) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>En attente de lancement...</p>
        <button
          onClick={() => navigate("/")}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎯 Objectif de la partie {code}</h2>
      <p>Bienvenue <strong>{pseudo}</strong> !</p>
      <p>Ta cible est : <strong>{cibleActuelle}</strong></p>
      <p>🎯 Ta mission : <em>{missionActuelle}</em></p>

      {infos && (
        <div>
          <h2>Bienvenue {infos.pseudo}</h2>
          <p>🎯 Ta cible : <strong>{infos.cible}</strong></p>
          <p>🎭 Ta mission : <em>{infos.mission}</em></p>
          <p>🔐 Code partie : {infos.code}</p>
        </div>
      )}


      {notification && (
        <div style={{ marginTop: "2rem", border: "2px dashed red", padding: "1rem", backgroundColor: "#ffe5e5" }}>
          <p><strong>{notification.tueur}</strong> t’a ciblé avec cette mission :</p>
          <blockquote>{notification.message}</blockquote>
          <button
            onClick={handleValidationElimination}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "crimson",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ✅ J’ai été éliminé
          </button>
        </div>
      )}

      {!modeValidation ? (
        <button
          onClick={() => setModeValidation(true)}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ✅ Mission accomplie
        </button>
      ) : (
        <div style={{ marginTop: "2rem" }}>
          <textarea
            rows={4}
            placeholder="Décris ici comment tu as accompli ta mission..."
            value={texteMission}
            onChange={(e) => setTexteMission(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}
          />
          <button
            onClick={handleEnvoyerMission}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            📤 Envoyer à ma cible
          </button>
        </div>
      )}
    </div>
  );
}
