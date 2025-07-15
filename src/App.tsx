import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CreerPartie from "./pages/CreerPartie";
import RejoindrePartie from "./pages/RejoindrePartie";
import SalleAttente from "./pages/SalleAttente";
import Jeu from "./pages/Jeu";
import Victoire from "./pages/Victoire";
import { Navigate } from "react-router-dom";
import "./themesombre.css";
import Elimine from "./pages/Elimine";
import Inscription from "./pages/Inscription";
import Connexion from "./pages/Connexion";
import ProfilBar from "./components/ProfilBar";
import Profil from "./pages/Profil";
import { useEffect } from "react";
import { initSocketListeners } from "./socket";


function Accueil() {
  const navigate = useNavigate();
  const pseudo = localStorage.getItem("pseudo");

    // ✅ Stocke tka_pseudo dès l’arrivée sur la page
  useEffect(() => {
    if (pseudo) {
      localStorage.setItem("tka_pseudo", pseudo);
    }
  }, [pseudo]);

  return (
    <div className="accueil-container">
      {/* ✅ Barre en haut à droite */}
      <div className="profil-bar">
        {pseudo ? (
          <ProfilBar />
        ) : (
          <>
            <button className="profil-button" onClick={() => navigate("/inscription")}>
              🧑‍💼 Créer un profil
            </button>
            <button className="profil-button" onClick={() => navigate("/connexion")}>
              🔐 Connexion
            </button>
          </>
        )}
      </div>

      <h1 className="accueil-title">Killer · Le Jeu</h1>
      <p className="accueil-subtitle">
        Éliminez votre cible. Soyez discret. Survivez.
      </p>

      <button
        className="accueil-button"
        onClick={() => {
          const pseudo = localStorage.getItem("pseudo");

          if (pseudo) {
            localStorage.setItem("tka_pseudo", pseudo);      // ✅ stockage correct
            localStorage.setItem("tka_createur", "true");    // ✅ joueur est créateur
            navigate("/creer");                          
          } else {
            navigate("/creer");                              // 👤 pas connecté → entre son pseudo
          }
        }}
      >
        Créer une partie
      </button>

      <button className="accueil-button" onClick={() => navigate("/rejoindre")}>
        Rejoindre une partie
      </button>
    </div>
  );
}

export default function App() {

    useEffect(() => {
    initSocketListeners(); // ✅ initialise les sockets globaux une seule fois
  }, []);

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
        <Route path="/elimine" element={<Elimine />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </BrowserRouter>
  );
}
