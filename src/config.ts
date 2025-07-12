const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd
  ? "https://the-killer.onrender.com" // 🔁 remplace par ton vrai backend Render
  : "http://localhost:3000";
