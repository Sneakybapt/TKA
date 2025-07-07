import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CreerPartie from "./pages/CreerPartie";
import RejoindrePartie from "./pages/RejoindrePartie";
import SalleAttente from "./pages/SalleAttente";
import Jeu from "./pages/Jeu";
import Victoire from "./pages/Victoire";
import { Navigate } from "react-router-dom";

function Accueil() {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: "1rem 2rem",
    margin: "1rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#222",
    color: "#fff",
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f7f7f7",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
        Killer · Le Jeu
      </h1>
      <p style={{ maxWidth: "400px", marginBottom: "2rem", fontSize: "1.1rem" }}>
        Éliminez votre cible. Soyez discret. Survivez.
      </p>

      <button style={buttonStyle} onClick={() => navigate("/creer")}>
        Créer une partie
      </button>
      <button
        style={{ ...buttonStyle, backgroundColor: "#555" }}
        onClick={() => navigate("/rejoindre")}
      >
        Rejoindre une partie
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/creer" element={<CreerPartie />} />
        <Route path="/rejoindre" element={<RejoindrePartie />} />
        <Route path="/attente" element={<SalleAttente />} />
        <Route path="/jeu" element={<Jeu />} />
        <Route path="/victoire" element={<Victoire />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
