const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Pega o token que vem no cabeçalho (Header) da requisição
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    // 2. O padrão de mercado é enviar o token como "Bearer hf83hfh..."
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Formato de token inválido.' });
    }

    const token = parts[1];

    try {
        // 3. Verifica se o token é válido e foi assinado com a nossa senha secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Pendura as informações do usuário (id, nome, perfil) na requisição
        // Isso permite que o Controller saiba exatamente quem fez a chamada
        req.usuario = decoded;
        
        // 5. Libera a catraca para a requisição seguir o fluxo
        return next();
    } catch (erro) {
        return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
    }
};