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

  useEffect(() => {
    if (!code || !pseudo) return;

    socket.on("partie_creee", ({ joueurs }) => {
      setJoueurs(joueurs);
    });

    socket.on("mise_a_jour_joueurs", (data: Joueur[]) => {
      setJoueurs(data);
    });

    return () => {
      socket.off("partie_creee");
      socket.off("mise_a_jour_joueurs");
    };
  }, [code, pseudo]);

  useEffect(() => {
    // Quand la partie est lancée, on redirige vers la page /jeu avec les infos du joueur
    socket.on("partie_lancee", ({ pseudo, cible, mission, code }) => {
      // ✅ Sauvegarde des infos
      localStorage.setItem("tka_pseudo", pseudo);
      localStorage.setItem("tka_code", code);
      localStorage.setItem("tka_mission", mission);
      localStorage.setItem("tka_cible", cible);

      // ✅ Redirection vers la page du jeu
      navigate("/jeu", { state: { pseudo, cible, mission, code } });
    });

    socket.on("erreur", (message) => {
      alert(message);
    });

    return () => {
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
          style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", fontSize: "1rem" }}
          onClick={() => socket.emit("lancer_partie", code)}
        >
          Lancer la partie
        </button>
      )}
    </div>
  );
}
