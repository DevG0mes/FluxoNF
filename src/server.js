require('dotenv').config(); // Carrega as variáveis do arquivo .env
const app = require('./app');

// Pega a porta do .env ou usa a 3000 como padrão
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}/api/status`);
});