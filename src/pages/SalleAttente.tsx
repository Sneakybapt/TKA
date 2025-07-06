import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../socket";

type Joueur = {
  id: string;
  pseudo: string;
};

export default function SalleAttente() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔁 Fallback si location.state est vide (refresh ou accès direct)
  const state = location.state || {
    code: localStorage.getItem("tka_code")?.trim().toUpperCase(),
    pseudo: localStorage.getItem("tka_pseudo")?.trim().toLowerCase(),
    joueurs: [],
    estCreateur: false,
  };

  const { code, pseudo, joueurs: joueursInitiaux, estCreateur } = state;
  const [joueurs, setJoueurs] = useState<Joueur[]>(joueursInitiaux || []);
  const [readyToLaunch, setReadyToLaunch] = useState(false);

  // 🚨 Sécurité en cas de données manquantes
  useEffect(() => {
    if (!code || !pseudo) {
      navigate("/rejoindre");
    }
  }, [code, pseudo, navigate]);

  // 🔁 Tentative de reconnexion si refresh
  useEffect(() => {
    const pseudoLS = localStorage.getItem("tka_pseudo")?.trim().toLowerCase();
    const codeLS = localStorage.getItem("tka_code")?.trim().toUpperCase();

    if (pseudoLS && codeLS) {
      socket.emit("reconnexion", { pseudo: pseudoLS, code: codeLS });
    }
  }, []);

  useEffect(() => {
    setReadyToLaunch(true);

    socket.on("partie_creee", ({ joueurs }) => {
      setJoueurs(joueurs);
    });

    socket.on("mise_a_jour_joueurs", (data: Joueur[]) => {
      setJoueurs(data);
    });

    socket.on("partie_lancee", ({ pseudo, cible, mission, code }) => {
      localStorage.setItem("tka_pseudo", pseudo.trim().toLowerCase());
      localStorage.setItem("tka_code", code.trim().toUpperCase());
      localStorage.setItem("tka_mission", mission);
      localStorage.setItem("tka_cible", cible);

      setTimeout(() => {
        navigate("/jeu");
      }, 50);
    });

    socket.on("erreur", (message) => {
      alert(message);
    });

    return () => {
      socket.off("partie_creee");
      socket.off("mise_a_jour_joueurs");
      socket.off("partie_lancee");
      socket.off("erreur");
    };
  }, [navigate]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🕹️ Salle d’attente</h2>
      <p><strong>Code de la partie :</strong> {code}</p>

      <h3>Joueurs connectés :</h3>
      <ul>
        {joueurs.map((j) => (
          <li key={j.id}>{j.pseudo}</li>
        ))}
      </ul>

      {estCreateur && (
        <button
          disabled={!readyToLaunch}
          onClick={() => socket.emit("lancer_partie", code)}
          style={{
            marginTop: "2rem",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            opacity: readyToLaunch ? 1 : 0.5,
            cursor: readyToLaunch ? "pointer" : "not-allowed",
          }}
        >
          🚀 Lancer la partie
        </button>
      )}
    </div>
  );
}
