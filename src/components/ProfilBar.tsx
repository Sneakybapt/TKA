import { useNavigate } from "react-router-dom";

export default function ProfilBar() {
  const pseudo = localStorage.getItem("pseudo");
  const navigate = useNavigate();

  if (!pseudo) return null;

  return (
    <>
      <button
        className="profil-button"
        onClick={() => navigate("/profil")}
      >
        👤 Bienvenue {pseudo}
      </button>
      <button
        className="profil-button"
        onClick={() => {
          localStorage.removeItem("pseudo");
          navigate("/");
        }}
      >
        🔓 Déconnexion
      </button>
    </>
  );
}
