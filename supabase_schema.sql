-- Script para criar a tabela de leads no Supabase / PostgreSQL

CREATE TYPE lead_status AS ENUM ('frio', 'morno', 'quente', 'pronto', 'qualificando');

CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    telefone TEXT NOT NULL UNIQUE,
    nome TEXT,
    origem TEXT DEFAULT 'WhatsApp',
    regiao_interesse TEXT,
    tipo_imovel TEXT,
    renda_mensal TEXT,
    valor_entrada TEXT,
    interesse_financiamento BOOLEAN,
    prazo_compra TEXT,
    nivel_urgencia TEXT,
    status_funil lead_status DEFAULT 'qualificando'::lead_status,
    historico_mensagens JSONB DEFAULT '[]'::jsonb,
    score_qualificacao INTEGER DEFAULT 0,
    temperatura TEXT DEFAULT 'Frio',
    encaminhar_para_consultor BOOLEAN DEFAULT FALSE,
    resumo_sdr TEXT,
    orcamento NUMERIC,
    produto_interesse TEXT,
    ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    proxima_acao TEXT
);

-- Index para buscas rápidas pelo telefone
CREATE INDEX idx_leads_telefone ON public.leads(telefone);

-- Função para atualizar automaticamente a coluna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger que aciona a função em cada atualização na tabela leads
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
