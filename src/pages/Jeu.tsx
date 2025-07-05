import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

interface InfosJoueur {
  pseudo: string;
  code: string;
  cible: string;
  mission: string;
}

interface NotificationData {
  tueur: string;
  message: string;
}

export default function Jeu() {
  const navigate = useNavigate();
  const [infos, setInfos] = useState<InfosJoueur | null>(null);
  const [modeValidation, setModeValidation] = useState(false);
  const [texteMission, setTexteMission] = useState("");
  const [notification, setNotification] = useState<NotificationData | null>(null);

  // ✅ Restoration fiable au chargement
  useEffect(() => {
    const pseudo = localStorage.getItem("tka_pseudo");
    const code = localStorage.getItem("tka_code");
    const mission = localStorage.getItem("tka_mission");
    const cible = localStorage.getItem("tka_cible");

    if (pseudo && code && mission && cible) {
      setInfos({ pseudo, code, mission, cible });
      socket.emit("reconnexion", { pseudo, code });
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    // ✅ Si une nouvelle mission/cible est donnée ➜ on met à jour
    socket.on("partie_lancee", ({ pseudo, code, cible, mission }) => {
      localStorage.setItem("tka_pseudo", pseudo);
      localStorage.setItem("tka_code", code);
      localStorage.setItem("tka_mission", mission);
      localStorage.setItem("tka_cible", cible);
      setInfos({ pseudo, code, mission, cible });
    });

    socket.on("demande_validation", ({ tueur, message }) => {
      setNotification({ tueur, message });
    });

    socket.on("victoire", () => {
      navigate("/victoire");
    });

    return () => {
      socket.off("partie_lancee");
      socket.off("demande_validation");
      socket.off("victoire");
    };
  }, [navigate]);

  const handleEnvoyerMission = () => {
    if (!infos || texteMission.trim() === "") {
      alert("Merci de décrire comment tu as accompli ta mission 😇");
      return;
    }

    socket.emit("tentative_elimination", {
      code: infos.code,
      tueur: infos.pseudo,
      cible: infos.cible,
      message: texteMission.trim(),
    });

    setModeValidation(false);
    setTexteMission("");
    alert("Mission envoyée à ta cible. En attente de sa validation 👀");
  };

  const handleValidationElimination = () => {
    if (!notification || !infos) return;

    socket.emit("validation_elimination", {
      code: infos.code,
      cible: infos.pseudo,
      tueur: notification.tueur,
    });

    setNotification(null);
    navigate("/");
  };

  if (!infos) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>🔄 Chargement des données…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Bienvenue <strong>{infos.pseudo}</strong> !</h2>
      <p>🎯 Ta cible : <strong>{infos.cible}</strong></p>
      <p>🎭 Ta mission : <em>{infos.mission}</em></p>

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
