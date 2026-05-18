-- Script de migração idempotente para a Etapa 6

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS orcamento NUMERIC,
ADD COLUMN IF NOT EXISTS produto_interesse TEXT,
ADD COLUMN IF NOT EXISTS ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS proxima_acao TEXT;

-- Garantir que a coluna ultima_interacao seja atualizada via trigger se necessário, 
-- ou simplesmente deixaremos o n8n enviar o valor 'now()'.
