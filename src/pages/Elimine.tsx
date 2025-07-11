import { useEffect, useState } from "react";
import socket from "../socket";

interface Joueur {
  pseudo: string;
  cible: string;
  mission: string;
}

export default function Elimine() {
  const [vivants, setVivants] = useState<Joueur[]>([]);
  const [modeFantomeActive, setModeFantomeActive] = useState(false);

  const handleActiverModeFantome = () => {
    const code = localStorage.getItem("tka_code");
    if (code) {
      socket.emit("demande_survivants", { code });
    }
    setModeFantomeActive(true);
  };

  useEffect(() => {
    socket.on("liste_survivants", (data: Joueur[]) => {
      setVivants(data);
    });

    return () => {
      socket.off("liste_survivants");
    };
  }, []);

return (
  <div className="elimine-container">
    <h1>☠️ Tu as été éliminé</h1>
    {!modeFantomeActive ? (
      <>
        <p className="elimine-subtitle">
          L’opération se poursuit… mais tu peux encore observer silencieusement.
        </p>

        {/* ✅ BOUTONS SUR LA MÊME LIGNE */}
        <div className="elimine-actions">
          <button className="btn-retour" onClick={() => window.location.href = "/"}>
            🔙 Retourner au salon
          </button>

          <button className="btn-fantome" onClick={handleActiverModeFantome}>
            👻 Activer le mode fantôme
          </button>
        </div>
      </>
    ) : (
      <>
        <p className="elimine-subtitle">
          👁️ Espionnage en cours… voici les agents encore en mission :
        </p>

        <div className="fantome-liste">
          {vivants.map(({ pseudo, cible, mission }) => (
            <div key={pseudo} className="fantome-carte">
              <p><strong>{pseudo}</strong> ➜ <strong>{cible}</strong></p>
              <p>🕵️ Mission : <em>{mission}</em></p>
            </div>
          ))}
        </div>

        <button className="btn-retour" onClick={() => window.location.href = "/"}>
          🔙 Retourner au salon
        </button>
      </>
    )}
  </div>
);

}