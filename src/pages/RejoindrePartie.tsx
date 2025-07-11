import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import "../themesombre.css";

export default function RejoindrePartie() {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("confirmation_rejoindre", () => {
      // La mise à jour des joueurs arrive juste après
    });

    socket.on("mise_a_jour_joueurs", (joueurs) => {
      const pseudoNettoye = pseudo.trim().toLowerCase();
      const codeFormate = code.trim().toUpperCase();
      navigate("/attente", { state: { code: codeFormate, pseudo: pseudoNettoye, joueurs } });
    });

    socket.on("erreur", (message) => {
      alert(message);
    });

    return () => {
      socket.off("confirmation_rejoindre");
      socket.off("mise_a_jour_joueurs");
      socket.off("erreur");
    };
  }, [code, pseudo, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      alert("Code de partie requis");
      return;
    }

    const pseudoNettoye = pseudo.trim().toLowerCase();
    const codeFormate = code.trim().toUpperCase();

    localStorage.setItem("tka_pseudo", pseudoNettoye);
    localStorage.setItem("tka_code", codeFormate);

    socket.emit("rejoindre_partie", {
      code: codeFormate,
      pseudo: pseudoNettoye,
    });
  };

  return (
    <div className="rejoindre-container">
      <h2 className="rejoindre-title">🎯 Rejoindre une partie</h2>
      <form className="rejoindre-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="rejoindre-input"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          required
        />
        <input
          type="text"
          className="rejoindre-input"
          placeholder="Code de la partie"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit" className="accueil-button">
          Rejoindre
        </button>
      </form>
    </div>
  );
}