import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

interface StatsProfil {
  nbParties: number;
  nbVictoires: number;
  moyennePlace: string;
}

export default function Profil() {
  const [stats, setStats] = useState<StatsProfil | null>(null);
  const pseudo = localStorage.getItem("pseudo");

  useEffect(() => {
    async function fetchStats() {
      if (!pseudo) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/profil-stats?pseudo=${pseudo}`);
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("❌ Erreur lors du chargement du profil :", error);
      }
    }

    fetchStats();
  }, [pseudo]);

  if (!stats) return <p>Chargement…</p>;

  return (
    <div className="creer-container">
      <h2 className="creer-title">Profil de {pseudo}</h2>
      <p>🎮 Parties jouées : {stats.nbParties}</p>
      <p>🏆 Parties gagnées : {stats.nbVictoires}</p>
      <p>📊 Place moyenne : {stats.moyennePlace}</p>
    </div>
  );
}
