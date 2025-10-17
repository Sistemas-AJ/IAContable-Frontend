// Llama al endpoint /analyze para análisis financiero
export async function analyzeFinancialData(data) {
  try {
    const response = await axios.post('http://127.0.0.1:9000/analyze', { data });
    return response.data;
  } catch (error) {
    throw new Error('Error en el análisis financiero');
  }
}
import axios from 'axios';

// Servicios para comunicación con el backend
export async function sendMessageToBackend(message, filename = null, tool = null) {
  try {
    const body = { message };
    if (filename) body.filename = filename;
    if (tool) body.tool = tool;
    const response = await axios.post('http://127.0.0.1:9000/chat', body);
    return response.data;
  } catch (error) {
    throw new Error('Error en la respuesta del servidor');
  }
}

export async function uploadFileToBackend(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await axios.post('http://127.0.0.1:9000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error al subir el archivo');
  }
}
