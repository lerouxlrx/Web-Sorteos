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
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, '..', 'public', 'resultado_sorteo.pdf');
    const writeStream = fs.createWriteStream(pdfPath);
    
    doc.pipe(writeStream);

    // Título
    doc.fontSize(18).text('Resultado del Sorteo', { align: 'center' });
    doc.moveDown();

    // Todos los participantes
    doc.fontSize(11).text('Participantes:', { underline: true });
    todosConPosicion.forEach((participante) => {
      doc.text(`Posición: ${participante.Posicion} - ${participante.Nombre} - DNI: ${participante.DNI} - ${participante.Resultado} con ${participante.Chances} chances.`);
    });

    // Finalizar y guardar el PDF
    doc.end();

    // Resolver la promesa cuando el PDF se haya escrito
    writeStream.on('finish', () => {
      resolve(pdfPath); // Retorna la ruta del PDF generado
    });

    writeStream.on('error', (error) => {
      reject(error); // Manejar el error en caso de fallo
    });
  });
}

module.exports = {
  procesarArchivoExcel,
  contarParticipantes,
  realizarSorteo,
  generarPDF
};