import { useEffect, useState } from "react";

interface StatsProfil {
  nbParties: number;
  moyennePlace: string;
}

export default function Profil() {
  const [stats, setStats] = useState<StatsProfil | null>(null);
  const pseudo = localStorage.getItem("pseudo");

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch(`http://localhost:3000/api/profil-stats?pseudo=${pseudo}`);
      const data = await res.json();
      setStats(data);
    }
    fetchStats();
  }, [pseudo]);

  if (!stats) return <p>Chargement…</p>;

  return (
    <div className="creer-container">
      <h2 className="creer-title">👤 Fiche de {pseudo}</h2>
      <p>🎮 Parties jouées : {stats.nbParties}</p>
      <p>📊 Place moyenne (hors élimination) : {stats.moyennePlace}</p>
    </div>
  );
}
