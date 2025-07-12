import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import "../themesombre.css";

export default function CreerPartie() {
  const navigate = useNavigate();

  const pseudoConnecte = localStorage.getItem("pseudo")?.trim().toLowerCase();
  const estConnecte = !!pseudoConnecte;

  const [pseudo, setPseudo] = useState(pseudoConnecte || "");

  useEffect(() => {
    socket.on("partie_creee", ({ code, joueurs }) => {
      const pseudoNettoye = pseudo.trim().toLowerCase();
      console.log("Partie créée avec code :", code);
      localStorage.setItem("tka_pseudo", pseudoNettoye);
      localStorage.setItem("tka_code", code.toUpperCase());

      navigate("/attente", {
        state: {
          code,
          pseudo: pseudoNettoye,
          joueurs,
          estCreateur: true,
        },
      });
    });

    socket.on("erreur", (message) => {
      alert(message);
    });

    return () => {
      socket.off("partie_creee");
      socket.off("erreur");
    };
  }, [navigate, pseudo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pseudoNettoye = pseudo.trim().toLowerCase();
    socket.emit("creer_partie", { pseudo: pseudoNettoye });
  };

  return (
    <div className="creer-container">
      <h2 className="creer-title">🛠️ Créer une partie</h2>
      <form className="creer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="creer-input"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          required
          disabled={estConnecte} // ✅ désactivé si connecté
        />
        <button type="submit" className="accueil-button">
          Créer la partie
        </button>
      </form>
    </div>
  );
}
