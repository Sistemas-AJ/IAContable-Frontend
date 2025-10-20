

// Importaciones
import axios from "axios";

// Configuración base de la API
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:9000").replace(/\/$/, "");

// Instancia Axios para endpoints tradicionales
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Utilidad para construir rutas absolutas
export const getApiRoute = (route) => `${API_BASE}/${route}`;

// --- ENDPOINTS REALES DEL BACKEND ---

/**
 * Enviar mensaje al backend usando POST y procesar el stream SSE manualmente
 * @param {string} message
 * @param {string|null} filename
 * @param {string|null} tool
 * @returns {Promise<{response: string}>}
 * @param {string|null} session_id
 * @returns {Promise<{response: string}>}
 */
export async function sendMessageToBackend(message, filename = null, tool = null, session_id = null) {
  // Construir el cuerpo para POST
  const body = { message };
  if (filename) body.filename = filename;
  if (tool) body.tool = tool;
  if (session_id) body.session_id = session_id;

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Error en la respuesta del servidor');
  }

  // Procesar el stream SSE manualmente
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullResponse = '';
  let done = false;
  let buffer = '';

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      // Procesar eventos SSE
      const events = buffer.split(/\n\n/);
      buffer = events.pop(); // El último puede estar incompleto
      for (const event of events) {
        if (event.includes('event: end')) {
          // Fin del stream
          return { response: fullResponse.trim() };
        }
        const dataMatch = event.match(/data:([\s\S]*)/);
        if (dataMatch) {
          fullResponse += dataMatch[1].trim() + '\n';
        }
      }
    }
  }
  // Si termina sin evento 'end', devolver lo acumulado
  return { response: fullResponse.trim() };
}

/**
 * Subir archivo de sesión al backend
 * @param {File} file
 * @param {string|null} session_id
 * @returns {Promise<any>}
 */
export async function uploadSessionFileToBackend(file, session_id = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (session_id) formData.append('session_id', session_id);
  try {
    const response = await api.post('/session/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error al subir el archivo de sesión');
  }
}
