import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Asegúrate de que es el mismo que el puerto expuesto en docker-compose.yml
    proxy: {
      // Cuando React hace una llamada a /api/..., 
      // Vite la redirige a http://backend:9009
      // 'backend' es el nombre del servicio en Docker Compose.
      '/api': {
        target: 'http://backend:9009',
        changeOrigin: true,
        secure: false, // Puedes omitir esto si no tienes HTTPS local
        rewrite: (path) => path.replace(/^\/api/, '') // Opcional: si la API no espera '/api'
      }
    }
  }
});