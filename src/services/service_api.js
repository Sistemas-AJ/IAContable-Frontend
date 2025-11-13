import axios from 'axios';

const api = axios.create({
  baseURL: '/api',   // <<< clave: relativo, sin host/puerto
  timeout: 30000
});

export default api;
