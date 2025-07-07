import { useNavigate } from "react-router-dom";

export default function Victoire() {
  const navigate = useNavigate();

  const handleRetourAccueil = () => {
    // 🧹 Optionnel : nettoyage du localStorage
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>🏆 Tu as gagné !</h1>
      <p>Félicitations, tu es le dernier survivant de l’arène.</p>
      <p>Version 2 : classement des éliminations à venir 😎</p>

      <button
        onClick={handleRetourAccueil}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          backgroundColor: "#222",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        🔙 Retour à l’accueil
      </button>
    </div>
  );
}
