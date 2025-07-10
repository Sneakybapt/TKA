import { useEffect, useState } from "react";
import socket from "../socket";

interface Joueur {
  pseudo: string;
  cible: string;
  mission: string;
}

export default function Elimine() {
  const [vivants, setVivants] = useState<Joueur[]>([]);

  useEffect(() => {
    const code = localStorage.getItem("tka_code");
    if (code) {
      socket.emit("demande_survivants", { code });
    }

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
    <p className="elimine-subtitle">Mais tu peux observer la partie comme un agent fantôme...</p>

    <div className="fantome-liste">
        {vivants.map(({ pseudo, cible, mission }) => (
        <div key={pseudo} className="fantome-carte">
            <p><strong>{pseudo}</strong> ➜ <strong>{cible}</strong></p>
            <p>🕵️ Mission : <em>{mission}</em></p>
        </div>
        ))}
    </div>

    <button className="btn-retour" onClick={() => window.location.href = "/"}>
        Retourner à l’accueil
    </button>
    </div>
    );

}
