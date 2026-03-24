const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Importando as rotas
const rotasDocumentos = require('./routes/documentosRoutes');
const rotasAuth = require('./routes/authRoutes'); // <- Nova rota

// Injetando as rotas na aplicação
app.use('/api/documentos', rotasDocumentos);
app.use('/api/auth', rotasAuth); // <- Nova rota

app.get('/api/status', (req, res) => {
    res.json({ mensagem: 'API do Sistema de Notas Fiscais operando normalmente!', status: 'OK' });
});

module.exports = app;