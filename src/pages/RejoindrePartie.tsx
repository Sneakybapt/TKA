import { useState } from "react";
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

    // Écoute une seule fois la réponse de confirmation
    socket.once("mise_a_jour_joueurs", (joueurs) => {
      navigate("/attente", { state: { code, pseudo, joueurs } });
    });

    // Écoute une seule fois une erreur potentielle
    socket.once("erreur", (message) => {
      alert(message);
    });

    // Envoie l’événement de tentative de connexion
    socket.emit("rejoindre_partie", { code: code.toUpperCase(), pseudo });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Rejoindre une partie</h2>
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
        <button type="submit" className="btn-rejoindre">
                    Rejoindre
        </button>
      </form>
    </div>
  );
}
