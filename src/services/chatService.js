import axios from 'axios';

// --- CONFIGURACIÓN DE AXIOS (para las peticiones que NO son stream) ---
const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// --- FUNCIÓN DE STREAMING (Nueva) ---
// Esta función no devuelve datos, sino que llama a callbacks
// a medida que los datos llegan.
export async function sendMessageToBackend(
  message,
  filename = null,
  tool = null,
  // --- Callbacks ---
  onMessage, // Se llama cuando llega un pedazo de texto
  onError,   // Se llama si hay un error
  onEnd      // Se llama cuando el stream termina
) {
  console.log("chatService.js: sendMessageToBackend llamado con:", { message, filename, tool }); // DEBUG
  try {
    const body = { message };
    if (filename) body.filename = filename;
    if (tool) body.tool = tool;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("chatService.js: Error de red, respuesta no OK:", response); // DEBUG
      throw new Error(`Error de red: ${response.statusText}`);
    }

    // Prepara el lector del stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("chatService.js: Reader finalizado (done=true)."); // DEBUG
        onEnd(); // El stream terminó
        break;
      }

      // Decodifica el chunk de datos
      const textChunk = decoder.decode(value, { stream: true });
      console.log("chatService.js (raw chunk):", JSON.stringify(textChunk)); // DEBUG (JSON.stringify para ver \n)
      partialData += textChunk;

      // Procesa los eventos de SSE (pueden venir varios en un chunk)
      let eventEndIndex;
      while ((eventEndIndex = partialData.indexOf('\n\n')) !== -1) {
        const eventData = partialData.substring(0, eventEndIndex);
        partialData = partialData.substring(eventEndIndex + 2); // +2 por '\n\n'

        // Extrae el tipo de evento y los datos
        const lines = eventData.split('\n');
        let eventType = null;
        let dataLine = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7);
          } else if (line.startsWith('data: ')) {
            dataLine = line.substring(6);
          }
        }

        if (eventType === 'message' && dataLine) {
          // Reemplaza <br> con saltos de línea reales para React
          const content = dataLine.replace(/<br>/g, '\n');
          console.log(`chatService.js (parsed message): Enviando chunk a React: "${content}"`); // DEBUG
          onMessage(content); // Llama al callback con el texto
        } else if (eventType === 'end') {
          console.log("chatService.js (parsed end): Evento 'end' recibido. Terminando."); // DEBUG
          onEnd();
          reader.cancel(); // Termina el bucle
          return;
        } else if (eventType === 'error') {
          console.error("chatService.js (parsed error): Evento 'error' recibido:", dataLine); // DEBUG
          onError(dataLine);
          onEnd();
          reader.cancel();
          return;
        } else {
          // console.log("chatService.js: Recibido chunk de SSE no reconocido:", eventData); // DEBUG (Opcional, mucho ruido)
        }
      }
    }
  } catch (error) {
    console.error('chatService.js: Error fatal en el stream fetch:', error); // DEBUG
    onError(error.message);
    onEnd();
  }
}

// --- FUNCIONES EXISTENTES (Sin cambios) ---

export async function uploadFileToBackend(file, tool) {
  const formData = new FormData();
  formData.append('file', file);
  // Añadimos la herramienta como metadata si existe
  if (tool) {
    formData.append('metadata', JSON.stringify({ tool }));
  }

  try {
    const { data: res } = await api.post('/upload', formData);
    return res;
  } catch {
    throw new Error('Error al subir el archivo');
  }
}

export async function analyzeFinancialData(data) {
  try {
    const { data: res } = await api.post('/analyze', { data });
    return res;
  } catch {
    throw new Error('Error en el análisis financiero');
  }
}