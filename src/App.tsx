import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CreerPartie from "./pages/CreerPartie";
import RejoindrePartie from "./pages/RejoindrePartie";
import SalleAttente from "./pages/SalleAttente";
import Jeu from "./pages/Jeu";
import Victoire from "./pages/Victoire";
import { Navigate } from "react-router-dom";
import "./themesombre.css"; // 💡 ton fichier de thème global

function Accueil() {
  const navigate = useNavigate();

return (
  <div className="accueil-container">
    <h1 className="accueil-title">Killer · Le Jeu</h1>
    <p className="accueil-subtitle">
      Éliminez votre cible. Soyez discret. Survivez.
    </p>

    <button className="accueil-button" onClick={() => navigate("/creer")}>
      Créer une partie
    </button>
    <button className="accueil-button" onClick={() => navigate("/rejoindre")}>
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
