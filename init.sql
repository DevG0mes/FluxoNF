-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS sistema_notas_fiscais;
USE sistema_notas_fiscais;

-- Tabela de Perfis (Roles) para controle de acesso
CREATE TABLE perfis_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255)
);

-- Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES perfis_acesso(id)
);

-- Tabela Principal de Documentos Fiscais
CREATE TABLE documentos_fiscais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento VARCHAR(50) NOT NULL,
    status_atual VARCHAR(50) NOT NULL,
    dados_extraidos JSON,
    tempo_previsto_horas INT DEFAULT 0,
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    criado_por INT,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- Tabela de Anexos
CREATE TABLE anexos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_id INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    adicionado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES documentos_fiscais(id) ON DELETE CASCADE
);

-- Tabela de Registro Geral (Histórico de Movimentações)
CREATE TABLE historico_movimentacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_id INT NOT NULL,
    usuario_id INT NOT NULL,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    dados_alterados JSON,
    tempo_permanencia_segundos INT DEFAULT 0,
    movimentado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES documentos_fiscais(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Inserindo perfis básicos
INSERT INTO perfis_acesso (nome, descricao) VALUES 
('Administrador', 'Acesso total ao sistema e configurações'),
('Recepcao', 'Acesso à lista de Recebimento'),
('Fiscal', 'Acesso à Escrituração e Registro Geral'),
('Compras', 'Acesso a Compras sem pedido e pedido incorreto');

-- Inserindo um usuário de sistema (ID 1) para as automações iniciais
INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES 
('Sistema Automático', 'sistema@psienergy.com', 'hash_falso_sistema', 1);