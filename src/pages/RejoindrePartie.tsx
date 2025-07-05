import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";

export default function RejoindrePartie() {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      alert("Code de partie requis");
      return;
    }

    // Sauvegarde dans le navigateur
    localStorage.setItem("tka_pseudo", pseudo);
    localStorage.setItem("tka_code", code.toUpperCase());
    
    socket.once("confirmation_rejoindre", ({ code, pseudo }) => {
      socket.once("mise_a_jour_joueurs", (joueurs) => {
        navigate("/attente", { state: { code, pseudo, joueurs } });
  });
    });


    socket.once("erreur", (message) => {
      alert(message);
    });

    socket.emit("rejoindre_partie", { code: code.toUpperCase(), pseudo });
  };

  // 🔁 Tentative automatique de reconnexion
  useEffect(() => {
    const savedPseudo = localStorage.getItem("tka_pseudo");
    const savedCode = localStorage.getItem("tka_code");

    if (savedPseudo && savedCode) {
      socket.emit("reconnexion", {
        pseudo: savedPseudo,
        code: savedCode
      });

      socket.once("reconnexion_ok", ({ joueurs }) => {
        navigate("/attente", { state: { code: savedCode, pseudo: savedPseudo, joueurs } });
      });

      socket.once("erreur", (message) => {
        console.warn("⚠️ Reconnexion échouée :", message);
      });
    }
  }, []);

  return (
    <div className="container">
      <h2>Rejoindre une partie</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Code de la partie"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="input"
        />
        <button type="submit" className="btn-rejoindre">
          Rejoindre
        </button>
      </form>
    </div>
  );
}
