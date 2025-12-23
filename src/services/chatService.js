import axios from 'axios';

// Cliente axios reutilizable para las peticiones que no son stream
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// --- FUNCIÓN DE STREAMING ---
// Devuelve el stream como callbacks; incluye session_id si existe.
export async function sendMessageToBackend(
  message,
  sessionId = '',
  filename = null,
  tool = null,
  // Callbacks
  onMessage,
  onError,
  onEnd,
  onSessionId
) {
  console.log('chatService.js: sendMessageToBackend llamado con:', { message, sessionId, filename, tool }); // DEBUG
  try {
    const body = { message };
    if (sessionId) body.session_id = sessionId;
    if (filename) body.filename = filename;
    if (tool) body.tool = tool;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('chatService.js: Error de red, respuesta no OK:', response); // DEBUG
      throw new Error(`Error de red: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('chatService.js: Reader finalizado (done=true).'); // DEBUG
        onEnd();
        break;
      }

      const textChunk = decoder.decode(value, { stream: true });
      console.log('chatService.js (raw chunk):', JSON.stringify(textChunk)); // DEBUG
      partialData += textChunk;

      let eventEndIndex;
      while ((eventEndIndex = partialData.indexOf('\n\n')) !== -1) {
        const eventData = partialData.substring(0, eventEndIndex);
        partialData = partialData.substring(eventEndIndex + 2);

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

        if (eventType === 'session_id' && dataLine) {
          onSessionId?.(dataLine);
        } else if (eventType === 'message' && dataLine) {
          const content = dataLine.replace(/<br>/g, '\n');
          console.log(`chatService.js (parsed message): Enviando chunk a React: "${content}"`); // DEBUG
          onMessage(content);
        } else if (eventType === 'end') {
          console.log("chatService.js (parsed end): Evento 'end' recibido. Terminando."); // DEBUG
          onEnd();
          reader.cancel();
          return;
        } else if (eventType === 'error') {
          console.error("chatService.js (parsed error): Evento 'error' recibido:", dataLine); // DEBUG
          onError(dataLine);
          onEnd();
          reader.cancel();
          return;
        }
      }
    }
  } catch (error) {
    console.error('chatService.js: Error fatal en el stream fetch:', error); // DEBUG
    onError(error.message);
    onEnd();
  }
}

// --- PETICIONES NO STREAM (axios) ---

export async function uploadFileToBackend(file, tool, sessionId = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (tool) {
    formData.append('metadata', JSON.stringify({ tool }));
  }
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  try {
    const { data: res } = await api.post('/session/upload', formData);
    return res;
  } catch {
    throw new Error('Error al subir el archivo');
  }
}

export async function analyzeFinancialData(data, sessionId = '') {
  const payload = sessionId ? { ...data, session_id: sessionId } : data;
  try {
    const { data: res } = await api.post('/analyze', { data: payload });
    return res;
  } catch {
    throw new Error('Error en el análisis financiero');
  }
}
