import { io } from "socket.io-client";

const socket = io("https://the-killer.onrender.com");

export default socket;

// ✅ Fonction pour initialiser les listeners globaux
export function initSocketListeners() {
  socket.on("joueur_elimine", (pseudoElimine: string) => {
    console.log("📡 joueur_elimine reçu :", pseudoElimine);

    const elimines: { pseudo: string; position: number }[] =
      JSON.parse(localStorage.getItem("tka_elimines") || "[]");

    if (elimines.some(j => j.pseudo === pseudoElimine)) return;

    const position = elimines.length + 2;
    elimines.push({ pseudo: pseudoElimine, position });

    localStorage.setItem("tka_elimines", JSON.stringify(elimines));
    console.log("📦 Éliminé enregistré :", pseudoElimine, "→", position);
  });
}
