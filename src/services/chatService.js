

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
 * Enviar mensaje al backend usando POST y procesar el stream SSE manualmente, permitiendo mostrar la respuesta en tiempo real.
 * @param {string} message
 * @param {string|null} filename
 * @param {string|null} tool
 * @param {string|null} session_id
 * @param {(partial: string) => void} [onProgress] - Callback para cada fragmento recibido
 * @returns {Promise<{response: string}>}
 */
export async function sendMessageToBackend(message, filename = null, tool = null, session_id = null, onProgress = null) {
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
      const events = buffer.split(/\n\n/);
      buffer = events.pop();
      for (const event of events) {
        if (event.includes('event: end')) {
          if (onProgress) onProgress(fullResponse.trim());
          return { response: fullResponse.trim() };
        }
        const dataMatch = event.match(/data:([\s\S]*)/);
        if (dataMatch) {
          const fragment = dataMatch[1].trim();
          fullResponse += fragment + '\n';
          if (onProgress) onProgress(fullResponse.trim());
        }
      }
    }
  }
  if (onProgress) onProgress(fullResponse.trim());
  return { response: fullResponse.trim() };
}

/**
 * Subir archivo de sesión al backend
 * @param {File} file
 * @param {string|null} tool
 * @returns {Promise<any>}
 */
export async function uploadSessionFileToBackend(file, tool = null) {
  const formData = new FormData();
  formData.append('file', file);
  // Enviar el session_id actual si existe
  if (window.lastSessionId) {
    formData.append('session_id', window.lastSessionId);
  }
  if (tool) {
    formData.append('tool', tool);
  }
  try {
    // Usar fetch para poder leer texto plano fácilmente
    const response = await fetch(`${API_BASE}/session/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error('Error al subir el archivo de sesión');
    }
    const text = await response.text();
    // Devolver el texto plano como un objeto para mantener compatibilidad
    return { message: text };
  } catch (error) {
    throw new Error('Error al subir el archivo de sesión');
  }
}
