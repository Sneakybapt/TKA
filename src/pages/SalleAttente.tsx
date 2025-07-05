import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../socket";

type Joueur = {
  id: string;
  pseudo: string;
};

export default function SalleAttente() {
  const location = useLocation();
  const navigate = useNavigate();
  const { code, pseudo, joueurs: joueursInitiaux, estCreateur } = location.state || {};
  const [joueurs, setJoueurs] = useState<Joueur[]>(joueursInitiaux || []);
  const [readyToLaunch, setReadyToLaunch] = useState(false);

  // 🚨 Garde-fou si on accède à /attente sans passer par rejoindre
  if (!code || !pseudo) {
    navigate("/rejoindre");
    return null;
  }

  useEffect(() => {

    setReadyToLaunch(true); // 🧠 On attend que les listeners soient prêts
    socket.on("partie_creee", ({ joueurs }) => {
      setJoueurs(joueurs);
    });

    socket.on("mise_a_jour_joueurs", (data: Joueur[]) => {
      setJoueurs(data);
    });

    socket.on("partie_lancee", ({ pseudo, cible, mission, code }) => {
      // ✅ Sauvegarde pour reprise après refresh
      localStorage.setItem("tka_pseudo", pseudo);
      localStorage.setItem("tka_code", code);
      localStorage.setItem("tka_mission", mission);
      localStorage.setItem("tka_cible", cible);

      // ⏱ Petit délai pour garantir l’écriture
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
  }, [code, pseudo, navigate]);

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
          Lancer la partie
        </button>

      )}
    </div>
  );
}
