-- Script para atualizar a tabela de leads no Supabase / PostgreSQL (Etapa 5)

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS score_qualificacao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS temperatura TEXT DEFAULT 'Frio',
ADD COLUMN IF NOT EXISTS encaminhar_para_consultor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resumo_sdr TEXT;
