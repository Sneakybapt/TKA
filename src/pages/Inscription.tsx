import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Inscription() {
  const [pseudo, setPseudo] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, motdepasse })
    });

    const data = await res.json();

    if (data.ok) {
      localStorage.setItem("pseudo", pseudo);
      navigate("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="creer-container">
      <h2 className="creer-title">🧑‍💼 Créer ton profil</h2>
      <div className="consignes-box">
        ⚠️ <strong>Consignes :</strong> Le pseudo ne doit contenir <u>aucune majuscule</u>.
      </div>

      <form className="creer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="creer-input"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          required
        />
        <input
          type="password"
          className="creer-input"
          placeholder="Mot de passe"
          value={motdepasse}
          onChange={(e) => setMotdepasse(e.target.value)}
          required
        />
        <button type="submit" className="accueil-button">
          🔐 Créer mon profil
        </button>
      </form>
    </div>
  );
}
