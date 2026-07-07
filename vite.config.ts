import { defineConfig } from 'vite'
import react from '@vitejs/react-swc' 
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
})