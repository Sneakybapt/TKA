import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Connexion() {
  const [pseudo, setPseudo] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/api/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, motdepasse })
    });

    const data = await res.json();

    if (data.ok) {
      localStorage.setItem("pseudo", pseudo); // Stock le pseudo pour l’affichage
      localStorage.setItem("tka_pseudo", pseudo);
      navigate("/"); // Retour à l’accueil
    } else {
      alert(data.message); // Affiche l'erreur
    }
  };

  return (
    <div className="creer-container">
      <h2 className="creer-title">🔐 Connexion</h2>
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
          Se connecter
        </button>
      </form>
    </div>
  );
}
