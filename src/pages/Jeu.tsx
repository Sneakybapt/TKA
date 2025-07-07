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
  const [enChargement, setEnChargement] = useState(true);
  const [modeValidation, setModeValidation] = useState(false);
  const [texteMission, setTexteMission] = useState("");
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    const pseudo = localStorage.getItem("tka_pseudo")?.trim().toLowerCase();
    const code = localStorage.getItem("tka_code");

    if (pseudo && code) {
      socket.emit("reconnexion", { pseudo, code });
    } else {
      setEnChargement(false);
    }

    const handleReception = (data: InfosJoueur) => {
      const { pseudo, code, mission, cible } = data;
      console.log("✅ Données joueur reçues :", data);
      setInfos({ pseudo, code, mission, cible });
      setEnChargement(false);
    };


    socket.on("reconnexion_ok", handleReception);
    socket.on("partie_lancee", handleReception);

    socket.on("demande_validation", ({ tueur, message }) => {
      setNotification({ tueur, message });
    });

    socket.on("victoire", () => {
      navigate("/victoire");
    });

    socket.on("erreur", (msg) => {
      console.warn("Erreur reçue :", msg);
      setEnChargement(false);
    });

    return () => {
      socket.off("reconnexion_ok", handleReception);
      socket.off("partie_lancee", handleReception);
      socket.off("demande_validation");
      socket.off("victoire");
      socket.off("erreur");
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

  if (enChargement) {
    return (
      <div style={{ padding: "2rem" }}>
        <p>🔄 Restauration de ta mission en cours…</p>
      </div>
    );
  }

  if (!infos) {
    navigate("/");
    return null;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Bienvenue <strong>{infos.pseudo}</strong> !</h2>
      <p>🎯 Ta cible : <strong>{infos.cible}</strong></p>
      <p>🎭 Ta mission : <em>{infos.mission}</em></p>

      {notification && (
        <div style={{ marginTop: "2rem", color: "white", border:"1px dashed #b22222", padding: "1rem", backgroundColor: "rgba(178, 34, 34, 0.30)" }}>
          <p><strong>{notification.tueur}</strong> t’a ciblé avec cette mission :</p>
          <blockquote>{notification.message}</blockquote>
          <button
            onClick={handleValidationElimination}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "rgba(178, 34, 34, 0.75)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
          🚫 J’ai été éliminé
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
            backgroundColor: "rgba(102,51,153, 0.75)",
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
