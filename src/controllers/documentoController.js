const documentoService = require('../services/documentoService');

class DocumentoController {
    async receberDocumento(req, res) {
        try {
            const dadosForms = req.body;

            if (!dadosForms.tipo_documento) {
                return res.status(400).json({ erro: 'O campo tipo_documento é obrigatório.' });
            }

            // Pega o ID de quem está logado. 
            const usuarioId = req.usuario.id;

            const resultado = await documentoService.processarEntrada(dadosForms, usuarioId);
            
            return res.status(201).json({
                mensagem: 'Documento processado e direcionado com sucesso!',
                dados: resultado
            });
            
        } catch (erro) {
            console.error('Erro ao processar documento:', erro);
            return res.status(500).json({ erro: 'Erro interno ao processar o documento fiscal.' });
        }
    }

    async listarFila(req, res) {
        try {
            const { status } = req.params; 
            const documentos = await documentoService.buscarPorStatus(status);
            return res.status(200).json(documentos);
        } catch (erro) {
            console.error('Erro ao buscar fila:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar os documentos.' });
        }
    }

    async movimentar(req, res) {
        try {
            const { id } = req.params;
            const { novo_status, dados_alterados } = req.body;

            if (!novo_status) {
                return res.status(400).json({ erro: 'O campo novo_status é obrigatório.' });
            }

            // ATUALIZAÇÃO: Agora usamos o ID do usuário real que fez o login!
            const usuarioId = req.usuario.id; 

            const resultado = await documentoService.movimentarDocumento(id, novo_status, usuarioId, dados_alterados);

            return res.status(200).json({
                mensagem: 'Documento movimentado com sucesso!',
                dados: resultado
            });
        } catch (erro) {
            console.error('Erro ao movimentar documento:', erro);
            return res.status(400).json({ erro: erro.message || 'Erro interno ao movimentar o documento.' });
        }
    }

    async buscarHistorico(req, res) {
        try {
            const { id } = req.params;
            const historico = await documentoService.obterAuditoria(id);
            return res.status(200).json(historico);
        } catch (erro) {
            console.error('Erro ao buscar histórico:', erro);
            return res.status(500).json({ erro: 'Erro interno ao buscar o histórico do documento.' });
        }
    }
    async uploadAnexo(req, res) {
        try {
            const { id } = req.params;
            const { originalname: nome, filename: key } = req.file;

            // O caminho que vamos guardar no banco (pode ser o nome do arquivo no disco)
            const caminho = `uploads/${key}`;

            await documentoService.salvarAnexo(id, nome, caminho);

            return res.status(201).json({
                mensagem: 'Arquivo anexado com sucesso!',
                arquivo: nome,
                url_local: caminho
            });
        } catch (erro) {
            console.error('Erro no upload:', erro);
            return res.status(500).json({ erro: 'Erro ao processar o anexo.' });
        }
    }
}

module.exports = new DocumentoController();