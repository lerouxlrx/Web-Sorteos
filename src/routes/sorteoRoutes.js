const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMidleware.js');
const sorteoService = require('../services/sorteoService.js');

// Página principal
router.get('/', (req, res) => {res.render('home')});
// Subir Excel a Configuración
router.post('/upload', upload.single('file'), (req, res) => {
  const { file } = req;
  const participantes = sorteoService.procesarArchivoExcel(file);
  const { conChances, sinChances } = sorteoService.contarParticipantes(participantes);
  const jsonParticipantes = JSON.stringify(participantes);
  res.render('configurarSorteo', { 
    conChances, 
    sinChances, 
    total: participantes.length, 
    jsonParticipantes 
  });
});
// Configuración a Sorteo
router.post('/confirmar-sorteo', (req, res) => {
  const { ganadores, suplentes, participantes } = req.body;

  const participantesArray = JSON.parse(participantes);
  if (!participantesArray || participantesArray.length === 0) {
    return res.status(400).send('No hay participantes disponibles para el sorteo.');
  }

  const { todosConPosicion, participantesGanadores, participantesSuplentes } = sorteoService.realizarSorteo(participantesArray, ganadores, suplentes);

  // Generar PDF con el resultado
  sorteoService.generarPDF(todosConPosicion)
    .then(pdfPath => {
      res.render('resultado', { participantesGanadores, participantesSuplentes, pdfPath });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error al generar el PDF.');
    });
});

module.exports = router;