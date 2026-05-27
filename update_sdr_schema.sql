-- Evolução do Schema para SDR Enterprise
-- Adicionando Inteligência de Profiling e Adaptação na tabela leads

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS perfil_psicologico TEXT,
ADD COLUMN IF NOT EXISTS tags_comportamentais JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nivel_urgencia TEXT,
ADD COLUMN IF NOT EXISTS tom_recomendado_ia TEXT;

-- Comentários para o dicionário de dados
COMMENT ON COLUMN public.leads.perfil_psicologico IS 'Analítico, Emocional, Objetivo, Desconfiado, Impulsivo, etc.';
COMMENT ON COLUMN public.leads.tags_comportamentais IS 'Tags como: ansioso, investidor, família, etc.';
COMMENT ON COLUMN public.leads.nivel_urgencia IS 'Baixa, Média, Alta';
COMMENT ON COLUMN public.leads.tom_recomendado_ia IS 'Como a IA deve abordar este lead nas próximas mensagens.';
