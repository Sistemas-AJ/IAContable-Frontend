import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw'; 
import * as XLSX from 'xlsx'; // Importamos la biblioteca
import '../components/ChatMessages.css';

// --- Expresiones regulares (Sin cambios) ---
const excelRegex = /'[^']+\.(xlsx|xls)'/gi;
const pdfRegex = /'[^']+\.pdf'/gi;
const wordRegex = /'[^']+\.(docx|doc)'/gi;

// --- Función applyHighlight (Sin cambios) ---
function applyHighlight(text) {
  if (!text) return text;
  return text
    .replace(excelRegex, '<span class="highlight-excel">$&</span>')
    .replace(pdfRegex, '<span class="highlight-pdf">$&</span>')
    .replace(wordRegex, '<span class="highlight-word">$&</span>');
}

// --- ¡INICIO: FUNCIÓN DE DESCARGA TOTALMENTE NUEVA Y MEJORADA! ---
/**
 * Crea y descarga un archivo Excel con estilos de tabla profesionales (color, bordes, etc.)
 * @param {Array<Array<string>>} data - Array de filas (donde la primera fila es el encabezado).
 * @param {string} fileName - Nombre del archivo a descargar (ej. "reporte.xlsx").
 */
const handleDownloadExcel = (data, fileName = 'tabla.xlsx') => {
  try {
    // 1. Ya tenemos los datos como Array-de-Arrays (AoA).
    const headers = data[0];
    const dataRows = data.slice(1);

    // 2. Crear la Hoja de Trabajo (Worksheet) directamente desde el AoA
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 3. Calcular anchos de columna (esta lógica es la misma de antes y es correcta)
    const colWidths = headers.map((header, i) => {
      let maxLength = header ? String(header).length : 10;
      dataRows.forEach(row => {
        const cellContent = row[i];
        if (cellContent) {
          const contentLength = String(cellContent).length;
          if (contentLength > maxLength) {
            maxLength = contentLength;
          }
        }
      });
      return { wch: maxLength + 2 }; // {wch: width_in_characters}
    });
    ws['!cols'] = colWidths; // Aplicar los anchos calculados

    // --- INICIO: SECCIÓN DE ESTILOS PROFESIONALES ---

    // 4. Definir los estilos
    const border = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } }, // Letra negra en negrita
      fill: { patternType: "solid", fgColor: { rgb: "E2EAF5" } }, // Fondo azul claro (puedes cambiar este RGB)
      border: border,
      alignment: { horizontal: "center", vertical: "center" } // Centrado
    };

    const cellStyle = {
      border: border,
      alignment: { vertical: "center" } // Solo centrado vertical
    };

    // 5. Aplicar los estilos a CADA celda
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) { // R = Fila
      for (let C = range.s.c; C <= range.e.c; ++C) { // C = Columna
        
        const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
        const cell = ws[cell_address];

        if (!cell) continue; // Omitir si la celda no existe

        if (R === 0) { // Fila 0 es el encabezado
          cell.s = headerStyle;
        } else { // El resto son celdas de datos
          cell.s = cellStyle;
        }
      }
    }
    // --- FIN: SECCIÓN DE ESTILOS PROFESIONALES ---

    // 6. Crear el Libro de Trabajo (Workbook) y añadir la hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // 7. Disparar la descarga
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error("Error al generar el archivo Excel:", error);
  }
};
// --- ¡FIN: FUNCIÓN DE DESCARGA TOTALMENTE NUEVA Y MEJORADA! ---


export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');

  // Detectar automáticamente bloques de tabla (mínimo dos filas con pipes)
  const lines = cleanText.split('\n');
  let elements = [];
  let i = 0;
  while (i < lines.length) {
    // Detectar inicio de bloque de tabla
    if (lines[i].includes('|')) {
      let tablaLines = [];
      
      // --- Lógica de Título (Sin cambios) ---
      let title = '';
      if (i > 0 && lines[i-1] && !lines[i-1].includes('|') && lines[i-1].trim().length > 0) {
        title = lines[i-1].replace(/\*\*/g, '').trim();
        if (elements.length > 0) {
          elements.pop(); 
        }
      }
      // --- Fin Lógica de Título ---

      // Mientras las siguientes líneas tengan pipes, es parte de la tabla
      while (i < lines.length && lines[i].includes('|')) {
        tablaLines.push(lines[i]);
        i++;
      }
      // Si hay al menos dos filas, renderizar como tabla
      if (tablaLines.length >= 2) {
        // ... (lógica de la tabla sin cambios) ...
        const tablaData = tablaLines.map(row =>
          row
            .split('|')
            .map(cell => cell.trim().replace(/-+/g, '').replace(/\*\*/g, '').trim()) 
            .filter(cell => cell.length > 0)
        );

        // --- Renderizado de Tabla (Sin cambios) ---
        elements.push(
          <div key={`table-card-${i}`} className="bot-table-card">
            
            <div className="bot-table-header-controls">
              {title && <h3 className="bot-table-title">{title}</h3>}
              <button 
                className="bot-table-download-btn" 
                onClick={() => handleDownloadExcel(tablaData, `${title.replace(/ /g, '_') || 'reporte'}.xlsx`)}
              >
                Descargar Excel
              </button>
            </div>

            <table className="bot-table">
              <thead>
                <tr>
                  {tablaData[0].map((cell, j) => (
                    <th key={`header-cell-${j}`}>{cell}</th>
                  ))}
                </tr>
              </thead>
              {tablaData.length > 1 && (
                <tbody>
                  {tablaData.slice(1).map((cols, k) => (
                    <tr key={`body-row-${k}`}>
                      {cols.map((cell, l) => (
                        <td key={`body-cell-${k}-${l}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        );
        // --- Fin Renderizado de Tabla ---
        continue;
      } else {
        // Si solo es una línea con pipes, mostrar como texto normal
        let blockText = applyHighlight(tablaLines.join('\n'));
        elements.push(
          <ReactMarkdown 
            key={`md-${i}`} 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex, rehypeRaw]} 
          >
            {blockText}
          </ReactMarkdown>
        );
        continue;
      }
    }
    
    // Si no es tabla, mostrar como Markdown normal
    let block = lines[i];
    if (block.trim().length > 0) {
      block = applyHighlight(block);
      elements.push(
        <ReactMarkdown 
          key={`md-block-${i}`} 
          remarkPlugins={[remarkMath]} 
          rehypePlugins={[rehypeKatex, rehypeRaw]} 
        >
          {block}
        </ReactMarkdown>
      );
    }
    i++;
  }

  if (elements.length > 0) {
    return <>{elements}</>;
  }

  // --- Fallback final (Sin cambios) ---
  cleanText = applyHighlight(cleanText);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]} 
    >
      {cleanText}
    </ReactMarkdown>
  );
}

// La función renderHtmlOrLines se mantiene igual
export function renderHtmlOrLines(text, keyBase) {
  // ... (sin cambios) ...
}