const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    // Cadastra um novo usuário no sistema
    async registrar(req, res) {
        try {
            const { nome, email, senha, perfil_id } = req.body;

            if (!nome || !email || !senha || !perfil_id) {
                return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
            }

            // Criptografa a senha antes de salvar no banco
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            const query = `INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)`;
            await db.execute(query, [nome, email, senhaHash, perfil_id]);

            return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
        } catch (erro) {
            console.error('Erro ao registrar:', erro);
            // Erro 1062 é o código do MySQL para "E-mail já cadastrado" (UNIQUE)
            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
        }
    }

    // Faz o login e devolve o Token JWT
    async login(req, res) {
        try {
            const { email, senha } = req.body;

            // Busca o usuário no banco
            const [usuarios] = await db.execute('SELECT * FROM usuarios WHERE email = ? AND ativo = TRUE', [email]);
            
            if (usuarios.length === 0) {
                return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
            }

            const usuario = usuarios[0];

            // Compara a senha digitada com a senha criptografada do banco
            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
            if (!senhaValida) {
                return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
            }

            // Gera o Token JWT (o "crachá" do usuário)
            const token = jwt.sign(
                { id: usuario.id, nome: usuario.nome, perfil_id: usuario.perfil_id },
                process.env.JWT_SECRET,
                { expiresIn: '8h' } // Token expira em 8 horas (um turno de trabalho)
            );

            return res.status(200).json({
                mensagem: 'Login realizado com sucesso!',
                token: token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    perfil_id: usuario.perfil_id
                }
            });

        } catch (erro) {
            console.error('Erro no login:', erro);
            return res.status(500).json({ erro: 'Erro interno ao realizar login.' });
        }
    }
}

module.exports = new AuthController();