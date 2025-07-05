import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Dossier de sortie (important pour Render)
  },
  server: {
    fs: {
      allow: ['.'], // ✅ permet l'accès aux fichiers racines
    },
  },
  // 💡 Ajout essentiel pour gérer les routes React en déploiement
  resolve: {
    conditions: ['development', 'browser'],
  },
  base: '/', // 🔥 clé pour les routes internes après build
})
