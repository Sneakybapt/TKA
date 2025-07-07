import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function ReprendrePartie() {
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    socket.on("reconnexion_ok", ({ pseudo, code, mission, cible }) => {
      console.log("🔄 Reconnexion OK : mission retrouvée");
      localStorage.setItem("tka_pseudo", pseudo.trim().toLowerCase());
      localStorage.setItem("tka_code", code.trim().toUpperCase());
      localStorage.setItem("tka_mission", mission);
      localStorage.setItem("tka_cible", cible);
      navigate("/jeu");
    });

    socket.on("erreur", (message) => {
      alert(message);
    });

    return () => {
      socket.off("reconnexion_ok");
      socket.off("erreur");
    };
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim() || !code.trim()) {
      alert("Pseudo et code requis");
      return;
    }
    const pseudoNettoye = pseudo.trim().toLowerCase();
    const codeFormate = code.trim().toUpperCase();
    socket.emit("reconnexion", { pseudo: pseudoNettoye, code: codeFormate });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🔁 Reprendre une partie</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Code de la partie"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          style={{ marginLeft: "1rem" }}
        />
        <button type="submit" style={{ marginLeft: "1rem" }}>
          Reprendre la partie
        </button>
      </form>
    </div>
  );
}
