const db = require('../config/database');

class DocumentoService {
    // ATUALIZAÇÃO: Adicionamos o usuarioId como parâmetro
    async processarEntrada(dadosForms, usuarioId) {
        const conexao = await db.getConnection();
        try {
            await conexao.beginTransaction();

            const tipoDocumento = dadosForms.tipo_documento; 
            const temPedido = dadosForms.tem_pedido;
            let statusAtual = '';

            if (tipoDocumento === 'REMESSA' || tipoDocumento === 'DANFE') {
                statusAtual = 'Recebimento';
            } else if (tipoDocumento === 'NFSTe' || tipoDocumento === 'NOTA DE DÉBITO/FATURA') {
                statusAtual = temPedido ? 'Escrituração' : 'Compras sem Pedido';
            } else if (tipoDocumento === 'CTE' || tipoDocumento === 'CONTA DE CONSUMO') {
                statusAtual = 'Escrituração';
            } else {
                statusAtual = 'Cadastro'; 
            }

            const queryDocumento = `
                INSERT INTO documentos_fiscais (tipo_documento, status_atual, dados_extraidos, criado_por)
                VALUES (?, ?, ?, ?)
            `;
            
            // ATUALIZAÇÃO: Usa o usuarioId real
            const [resultDoc] = await conexao.execute(queryDocumento, [
                tipoDocumento,
                statusAtual,
                JSON.stringify(dadosForms), 
                usuarioId 
            ]);
            
            const documentoId = resultDoc.insertId;

            const queryHistorico = `
                INSERT INTO historico_movimentacao (documento_id, usuario_id, status_novo, dados_alterados)
                VALUES (?, ?, ?, ?)
            `;
            
            // ATUALIZAÇÃO: Usa o usuarioId real
            await conexao.execute(queryHistorico, [
                documentoId,
                usuarioId,
                statusAtual,
                JSON.stringify({ acao: 'Entrada automática via sistema', dados_originais: dadosForms })
            ]);

            await conexao.commit();
            return { sucesso: true, documentoId, statusAtual };

        } catch (erro) {
            await conexao.rollback();
            throw erro;
        } finally {
            conexao.release();
        }
    }

    async buscarPorStatus(status) {
        const query = `
            SELECT id, tipo_documento, status_atual, dados_extraidos, tempo_previsto_horas, data_entrada, data_ultima_movimentacao 
            FROM documentos_fiscais 
            WHERE status_atual = ?
            ORDER BY data_entrada DESC
        `;
        const [linhas] = await db.execute(query, [status]);
        return linhas;
    }

    async movimentarDocumento(id, novoStatus, usuarioId, dadosModificados) {
        const conexao = await db.getConnection();
        try {
            await conexao.beginTransaction();

            const queryBusca = `
                SELECT 
                    status_atual, 
                    TIMESTAMPDIFF(SECOND, data_ultima_movimentacao, NOW()) AS permanencia_segundos
                FROM documentos_fiscais 
                WHERE id = ?
            `;
            
            const [docs] = await conexao.execute(queryBusca, [id]);

            if (docs.length === 0) {
                throw new Error('Documento fiscal não encontrado.');
            }

            const docAtual = docs[0];
            const statusAnterior = docAtual.status_atual;

            if (statusAnterior === novoStatus) {
                throw new Error('O documento já se encontra nesta lista.');
            }

            const permanenciaSegundos = docAtual.permanencia_segundos || 0;

            await conexao.execute(
                'UPDATE documentos_fiscais SET status_atual = ? WHERE id = ?',
                [novoStatus, id]
            );

            const queryHistorico = `
                INSERT INTO historico_movimentacao 
                (documento_id, usuario_id, status_anterior, status_novo, dados_alterados, tempo_permanencia_segundos)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await conexao.execute(queryHistorico, [
                id,
                usuarioId,
                statusAnterior,
                novoStatus,
                JSON.stringify(dadosModificados || { acao: 'Movimentação manual' }),
                permanenciaSegundos
            ]);

            await conexao.commit();
            return { 
                sucesso: true, 
                statusAnterior, 
                statusNovo: novoStatus, 
                tempoPermanenciaSegundos: permanenciaSegundos 
            };

        } catch (erro) {
            await conexao.rollback();
            throw erro;
        } finally {
            conexao.release();
        }
    }

    async obterAuditoria(documentoId) {
        const query = `
            SELECT 
                h.id AS log_id,
                u.nome AS responsavel,
                h.status_anterior,
                h.status_novo,
                h.tempo_permanencia_segundos,
                h.dados_alterados,
                h.movimentado_em
            FROM historico_movimentacao h
            INNER JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.documento_id = ?
            ORDER BY h.movimentado_em ASC
        `;
        
        const [linhas] = await db.execute(query, [documentoId]);
        return linhas;
    }
    async salvarAnexo(documentoId, nomeArquivo, caminhoArquivo) {
        const query = `
            INSERT INTO anexos (documento_id, nome_arquivo, caminho_arquivo)
            VALUES (?, ?, ?)
        `;
        await db.execute(query, [documentoId, nomeArquivo, caminhoArquivo]);
        return { sucesso: true };
    }
}

module.exports = new DocumentoService();