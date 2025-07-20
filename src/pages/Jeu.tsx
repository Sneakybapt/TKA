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
  const [missionsChangees, setMissionsChangees] = useState(0); // ✅ compteur mission
  const [missionValidee, setMissionValidee] = useState(false);

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

    socket.emit("verif_mission_validee", {
      pseudo: localStorage.getItem("tka_pseudo"),
      code: localStorage.getItem("tka_code")
    });

    socket.on("mission_validee_recue", ({ verrou }) => {
      if (verrou) {
        console.log("🔒 Mission verrouillée par le backend");
        setMissionValidee(true);
      }
    });




    socket.on("partie_lancee", handleReception);

    socket.on("demande_validation", ({ tueur, message }) => {
      setNotification({ tueur, message });
    });

    socket.on("joueur_elimine", (pseudoElimine) => {
      console.log("📡 joueur_elimine reçu :", pseudoElimine);
      const elimines: { pseudo: string; position: number }[] =
        JSON.parse(localStorage.getItem("tka_elimines") || "[]");

      if (elimines.some(j => j.pseudo === pseudoElimine)) return;

      const position = elimines.length + 2;
      elimines.push({ pseudo: pseudoElimine, position });

      localStorage.setItem("tka_elimines", JSON.stringify(elimines));
      console.log("📦 Éliminé enregistré :", pseudoElimine, "→", position);
    });

    socket.on("victoire", () => {
      navigate("/victoire");
    });

    socket.on("nouvelle_mission", ({ mission }) => {
      setInfos((prev) => prev ? { ...prev, mission } : prev);
      setMissionsChangees((count) => count + 1);
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
      socket.off("nouvelle_mission");
      socket.off("joueur_elimine");
      socket.off("mission_validee_recue");
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

  const handleChangerMission = () => {
    if (infos) {
      console.log("📡 Demande de changement de mission envoyée");
      socket.emit("demande_nouvelle_mission", {
        pseudo: infos.pseudo,
        code: infos.code
      });
    }
  };

    const handleValidationElimination = () => {
      console.log("🚨 handleValidationElimination déclenché");

      if (!notification || !infos) {
        console.warn("❌ Données manquantes :", { notification, infos });
        return;
      }

      const pseudoElimine = infos.pseudo;

      let elimines: { pseudo: string; position: number }[] =
        JSON.parse(localStorage.getItem("tka_elimines") || "[]");

      // ✅ Supprime toute entrée existante pour ce pseudo
      if (!elimines.some(j => j.pseudo === pseudoElimine)) {
        const position = elimines.length + 2;
        elimines.push({ pseudo: pseudoElimine, position });
        localStorage.setItem("tka_elimines", JSON.stringify(elimines));
        console.log("📦 Éliminé enregistré (via validation) :", pseudoElimine, "→", position);
      }


      const position = elimines.length + 2;
      elimines.push({ pseudo: pseudoElimine, position });

      localStorage.setItem("tka_elimines", JSON.stringify(elimines));
      console.log("📦 Éliminé enregistré (via validation) :", pseudoElimine, "→", position);

      socket.emit("validation_elimination", {
        code: infos.code,
        cible: pseudoElimine,
        tueur: notification.tueur,
      });

      setNotification(null);
      console.log("➡️ Navigation vers /elimine");
      navigate("/elimine");
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
    <div style={{ padding: "3rem" }}>
      <h2>Bienvenue {infos.pseudo} !</h2>
      <p style={{ fontSize: "1.2rem" }}>
        🎯 <strong>Ta cible : </strong>{infos.cible}
      </p>
      <p style={{ fontSize: "1.2rem" }}>
        🕵️ <strong>Ta mission :</strong> <em>{infos.mission}</em>
      </p>

      {!missionValidee && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <button
            disabled={missionsChangees >= 2}
            onClick={handleChangerMission}
            className="btn-relancermission"
          >
            ♻️ Changer de mission ({2 - missionsChangees} restant{missionsChangees === 1 ? "" : "s"})
          </button>

          <button
            onClick={() => setMissionValidee(true)}
            className="btn-retourmission"
          >
            ✅ Valider la mission
          </button>
        </div>
      )}



      <div style={{ height: "1.5rem" }} />

      {notification && (
        <div style={{
          marginTop: "2rem", color: "white", border: "1px dashed #b22222",
          padding: "1rem", backgroundColor: "rgba(178, 34, 34, 0.30)"
        }}>
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
            rows={5}
            placeholder="Décris ici comment tu as accompli ta mission..."
            value={texteMission}
            onChange={(e) => setTexteMission(e.target.value)}
            className="mission-textarea"
          />
          <button
            onClick={handleEnvoyerMission}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "rgba(102,51,153, 0.75)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            🗡️ Envoyer à ma cible
          </button>
        </div>
      )}
    </div>
  );
}
