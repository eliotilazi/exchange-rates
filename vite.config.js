import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions builds the site and publishes it on GitHub Pages under /exchange-rates/.
export default defineConfig({
  plugins: [react()],
  base: '/exchange-rates/',
})
