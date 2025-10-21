import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');
  
  // --- INICIO DE CORRECCIONES DE LATEX ---
  // Mantenemos esto, ya que limpia la entrada ANTES de procesarla
  cleanText = cleanText.replace(/\f(rac)/g, '\\$1');
  cleanText = cleanText.replace(/\t(ext)/g, '\\$1');
  cleanText = cleanText.replace(/\\ext/g, '\\text');
  cleanText = cleanText.replace(/\\rac/g, '\\frac');
  cleanText = cleanText.replace(/\\text\[(.*?)\]/g, '\\text{$1}');
  cleanText = cleanText.replace(/\\frac\[(.*?)\]\[(.*?)\]/g, '\\frac{$1}{$2}');
  cleanText = cleanText.replace(/rac\[(.*?)\]\[(.*?)\]/g, '\\frac{$1}{$2}');
  // --- FIN DE CORRECCIONES ---

  // --- !!! NUEVA CORRECCIÓN IMPORTANTE !!! ---
  // Convierte los bloques [ ... ] (que contienen LaTeX) a $$ ... $$
  // para que remark-math los entienda como bloques de fórmula.
  // Esto soluciona el problema de tu captura de pantalla.
  cleanText = cleanText.replace(/\[(.+?)\]/gs, (match, content) => {
    // Solo convierte si parece ser LaTeX (contiene un '\')
    if (content.includes('\\')) {
      return `$$${content.trim()}$$`;
    }
    // Si no, déjalo como está (podría ser texto normal entre corchetes)
    return match;
  });
  // --- FIN DE NUEVA CORRECCIÓN ---

  // Ahora, ReactMarkdown recibirá el texto con $$...$$ y sabrá qué hacer.
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {cleanText}
    </ReactMarkdown>
  );
}

// La función renderHtmlOrLines se mantiene igual (no la estamos usando aquí)
export function renderHtmlOrLines(text, keyBase) {
  if (/<h1>|<h2>|<strong>/.test(text)) {
    return <span key={keyBase} dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return text.split('\n').map((line, idx, arr) => (
    <React.Fragment key={keyBase + idx}>
      {line}
      {idx !== arr.length - 1 && <br />}
    </React.Fragment>
  ));
}