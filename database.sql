-- Arquivo de Configuração do Banco de Dados PostgreSQL (Manual)
-- Para rodar no seu banco de dados PostgreSQL antes de iniciar a aplicação.

-- Habilita a extensão de criptografia para gerar UUID v4 de forma nativa e segura
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remove a tabela se necessário (caso queira reiniciar a estrutura)
-- DROP TABLE IF EXISTS usuarios;

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_whatsapp TEXT UNIQUE NOT NULL,
  google_token_acesso TEXT,
  google_token_atualizacao TEXT,
  estado_da_conversa TEXT DEFAULT 'INICIO',
  plataforma_escolhida TEXT,
  ava_username TEXT,
  ava_password TEXT,
  ava_token TEXT,
  ava_secure_token TEXT,
  ava_user_id TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);
