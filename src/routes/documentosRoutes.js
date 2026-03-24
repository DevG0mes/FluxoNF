const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const authMiddleware = require('../middlewares/authMiddleware');

// NOVA REGRA: Todas as rotas abaixo desta linha vão exigir o Token JWT
router.use(authMiddleware);

// Rota POST para receber a entrada de novos documentos
router.post('/entrada', documentoController.receberDocumento);

// Rota GET para listar os documentos de uma fila específica
router.get('/fila/:status', documentoController.listarFila);

// Rota PUT para movimentar o documento de uma fila para outra
router.put('/:id/movimentar', documentoController.movimentar);

// Rota GET para buscar a linha do tempo (auditoria) de um documento específico
router.get('/:id/historico', documentoController.buscarHistorico);
router.post('/:id/anexo', multer(multerConfig).single('file'), documentoController.uploadAnexo);

module.exports = router;