import { useState } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";

export default function CreerPartie() {
  const [pseudo, setPseudo] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 💡 Nettoyage du pseudo
    const pseudoNettoye = pseudo.trim().toLowerCase();

    // Émission de l'événement vers le serveur
    socket.emit("creer_partie", { pseudo: pseudoNettoye });

    // Attente de la réponse du serveur
    socket.once("partie_creee", ({ code, joueurs }) => {
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
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Créer une partie</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Votre pseudo"
          required
        />
        <button type="submit" style={{ marginLeft: "1rem" }}>
          Créer la partie
        </button>
      </form>
    </div>
  );
}
