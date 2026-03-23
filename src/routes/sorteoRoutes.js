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
router.post('/confirmar-sorteo', async (req, res) => {
  const { ganadores, suplentes, participantes } = req.body;
  const participantesArray = JSON.parse(participantes);

  try {
    const resultados = sorteoService.realizarSorteo(participantesArray, ganadores, suplentes);
    const pdfPath = await sorteoService.generarPDF(resultados.todosConPosicion);

    // IMPORTANTE: Si la petición viene de nuestro JS (fetch), respondemos JSON
    if (req.headers.accept === 'application/json') {
      return res.json({ ...resultados, pdfPath });
    }

    // Si no, renderizamos normal (fallback)
    res.render('resultado', { ...resultados, pdfPath });
  } catch (error) {
    res.status(500).json({ error: 'Error procesando el sorteo' });
  }
});

module.exports = router;