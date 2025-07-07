import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";

export default function CreerPartie() {
  const [pseudo, setPseudo] = useState("");
  const navigate = useNavigate();

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
