import { useNavigate } from "react-router-dom";
import "../themesombre.css";

export default function Victoire() {
  const navigate = useNavigate();

  const handleRetourAccueil = () => {
    // 🧹 Optionnel : nettoyage du localStorage
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="victoire-container">
      <h1 className="victoire-title">🏆 Tu as gagné !</h1>
      <p className="victoire-message">
        Félicitations, tu es le dernier survivant de l’arène.
      </p>
      <p className="victoire-subtext">
        Version 2 : classement des éliminations à venir 😎
      </p>

      <button className="accueil-button" onClick={handleRetourAccueil}>
        🔙 Retour à l’accueil
      </button>
    </div>
  );
}
