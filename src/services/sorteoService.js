const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Procesar el archivo Excel
function procesarArchivoExcel(file) {
  const workbook = xlsx.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data; // Lista de participantes
}
// Contar participantes con y sin chances
function contarParticipantes(participantes) {
  const conChances = participantes.filter(p => p.Chances > 0);
  const sinChances = participantes.filter(p => !p.Chances || p.Chances === 0);
  return { conChances, sinChances };
}
// Realizar el sorteo
function realizarSorteo(participantes, numGanadores, numSuplentes) {
  let listaExtendida = [];
  let todosParticipantes = [...participantes];
  // Lista con participantes extendidos
  participantes.forEach(participante => {
      for (let i = 0; i < participante.Chances; i++) {
          listaExtendida.push(participante);
      }
  });
  // Barajar lista
  listaExtendida = shuffle(listaExtendida);
 // Asignar posiciones
  const ultimoSuplente = parseInt(numGanadores) + parseInt(numSuplentes)
  const todosConPosicion = [];
  let index = 0
  while (listaExtendida.length > 0) {
    const posicionParticipante = listaExtendida[Math.floor(Math.random() * listaExtendida.length)];
    
    let resultado;
    if (index < numGanadores) {
      resultado = "Ganador";
    } else if (index < ultimoSuplente) {
      resultado = "Suplente";
    } else {
      resultado = "Participante";
    }
    
    todosConPosicion.push({...posicionParticipante, Posicion: index + 1, Resultado: resultado });

    // Eliminar participante
    listaExtendida = listaExtendida.filter(p => p.Nombre !== posicionParticipante.Nombre);

    index++
  }
  // Array ganadores
  const participantesGanadores = todosConPosicion.slice(0, numGanadores);
  const participantesSuplentes = todosConPosicion.slice(numGanadores, ultimoSuplente);

  return { todosConPosicion, participantesGanadores, participantesSuplentes };
}
// Función para barajar lista
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
// Generar PDF con los resultados
function generarPDF(todosConPosicion) {
  return new Promise((resolve, reject) => {
    // Definimos márgenes para tener control
    const doc = new PDFDocument({ margin: 50 }); 
    const pdfPath = path.join(__dirname, '..', 'public', 'resultado_sorteo.pdf');
    const writeStream = fs.createWriteStream(pdfPath);
    
    doc.pipe(writeStream);

    // --- ENCABEZADO ---
    doc.fontSize(20).fillColor('#174791').text('ACTA DE RESULTADOS DEL SORTEO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('black').text(`Fecha: ${new Date().toLocaleDateString()} - Hora: ${new Date().toLocaleTimeString()}`, { align: 'right' });
    doc.moveDown(2);

    // --- LISTADO DE PARTICIPANTES ---
    doc.fontSize(14).fillColor('#e73329').text('Listado General de Posiciones:', { underline: true });
    doc.moveDown();

    doc.fontSize(10).fillColor('black');

    todosConPosicion.forEach((participante, index) => {
      // Verificamos si nos estamos quedando sin espacio en la hoja (y = 700 es casi el final)
      if (doc.y > 700) { 
        doc.addPage();
        // Volvemos a poner el título pequeño en la nueva hoja si queremos
        doc.fontSize(10).fillColor('grey').text('Continuación de resultados...', { align: 'center' });
        doc.moveDown();
      }

      // Estilo diferente para los ganadores en el PDF
      const esGanador = participante.Resultado === "Ganador";
      if (esGanador) doc.fillColor('#e73329').font('Helvetica-Bold');
      else doc.fillColor('black').font('Helvetica');

      doc.text(
        `Posición ${participante.Posicion}: ${participante.Nombre} - DNI: ${participante.DNI} (${participante.Resultado})`
      );
      
      doc.font('Helvetica').fontSize(8).fillColor('grey').text(`   Chances: ${participante.Chances}`, { indent: 10 });
      doc.moveDown(0.5);
      doc.fontSize(10); // Reset tamaño
    });

    // Finalizar
    doc.end();

    writeStream.on('finish', () => resolve(pdfPath));
    writeStream.on('error', (error) => reject(error));
  });
}

module.exports = {
  procesarArchivoExcel,
  contarParticipantes,
  realizarSorteo,
  generarPDF
};