import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import socket from "../socket";
import "../themesombre.css";

export default function Victoire() {
  const navigate = useNavigate();
  const [classement, setClassement] = useState<{ pseudo: string; position: number }[]>([]);

  useEffect(() => {
    const dejaEnregistre = localStorage.getItem("tka_partie_enregistree");
    if (dejaEnregistre === "true") return;

    console.log("🕵️ Attente du classement final...");

    socket.on("classement_final", (classementRecu) => {
      console.log("📦 Classement reçu :", classementRecu);

      const pseudo = localStorage.getItem("tka_pseudo");
      const code = localStorage.getItem("tka_code");

      type JoueurClassement = { pseudo: string; position: number };

      const estGagnant = classementRecu.find((j: JoueurClassement) =>
        j.pseudo === pseudo && j.position === 1
      );


      if (!estGagnant) {
        console.warn("⚠️ Ce joueur n'est pas le gagnant, pas d'enregistrement.");
        return;
      }

      localStorage.setItem("tka_partie_enregistree", "true");
      setClassement(classementRecu);

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

      {classement.length > 0 && (
        <div className="classement-final">
          <h2>📊 Classement final</h2>
          <ul>
            {[...classement]
              .sort((a, b) => a.position - b.position)
              .map(({ pseudo, position }: { pseudo: string; position: number }) => (
                <li key={pseudo}>
                  {position === 1 ? "🥇" : `#${position}`} {pseudo}
                </li>
            ))}

          </ul>
        </div>
      )}


      <button className="accueil-button" onClick={handleRetourAccueil}>
        🔙 Retour à l’accueil
      </button>
    </div>
  );
}
