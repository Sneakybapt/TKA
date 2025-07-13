import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "../themesombre.css";

export default function Victoire() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = localStorage.getItem("tka_code");
    const pseudoGagnant = localStorage.getItem("tka_pseudo");

    // ✅ Récupère les joueurs éliminés avec leur position
    const joueursElimines = JSON.parse(localStorage.getItem("tka_elimines") || "[]");
    // Format : [{ pseudo: "lucas", position: 8 }, { pseudo: "mateo", position: 7 }, ...]

    // ✅ Construit le classement final
    const classementFinal = [
      ...joueursElimines,
      { pseudo: pseudoGagnant, position: 1 } // ✅ le gagnant
    ];

    // ✅ Envoie au backend
    fetch(`${API_BASE_URL}/api/enregistrer-partie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, classement: classementFinal })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.ok) {
          console.error("❌ Erreur enregistrement partie :", data.message);
        } else {
          console.log("✅ Partie enregistrée :", classementFinal);
        }
      })
      .catch(err => {
        console.error("❌ Erreur réseau :", err);
      });
  }, []);

  const handleRetourAccueil = () => {
    localStorage.clear(); // 🧹 nettoyage
    navigate("/");
  };

  return (
    <div className="victoire-container">
      <h1 className="victoire-title">🏆 Tu as gagné !</h1>
      <p className="victoire-message">
        Félicitations, tu es le dernier survivant de l’arène.
      </p>
      <p className="victoire-subtext">
        Tes stats ont été enregistrées. Tu peux les consulter dans ton profil.
      </p>

      <button className="accueil-button" onClick={handleRetourAccueil}>
        🔙 Retour à l’accueil
      </button>
    </div>
  );
}
