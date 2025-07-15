import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import socket from "../socket";
import "../themesombre.css";

export default function Victoire() {
  const navigate = useNavigate();
  const setClassement = useState<{ pseudo: string; position: number }[]>([])[1];

  useEffect(() => {
    const dejaEnregistre = localStorage.getItem("tka_partie_enregistree");
    if (dejaEnregistre === "true") return;

    socket.on("classement_final", (classementRecu) => {
      console.log("📦 Classement reçu :", classementRecu);

      const code = localStorage.getItem("tka_code");
      localStorage.setItem("tka_partie_enregistree", "true");

      setClassement(classementRecu); // ✅ pour affichage si tu veux
      console.log("📡 Envoi fetch vers /api/enregistrer-partie :", { code, classement: classementRecu });

      fetch(`${API_BASE_URL}/api/enregistrer-partie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, classement: classementRecu })
      })
        .then(res => res.json())
        .then(data => {
          if (!data.ok) {
            console.error("❌ Erreur enregistrement partie :", data.message);
          } else {
            console.log("✅ Partie enregistrée :", classementRecu);
          }
        })
        .catch(err => {
          console.error("❌ Erreur réseau :", err);
        });
    });

    return () => {
      socket.off("classement_final");
    };
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
