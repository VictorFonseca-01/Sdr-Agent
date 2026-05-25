-- 1. Tabela de Corretores (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.corretores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_lead_recebido TIMESTAMP WITH TIME ZONE,
    quantidade_leads_ativos INTEGER DEFAULT 0,
    prioridade INTEGER DEFAULT 1,
    disponibilidade BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Atualizar a tabela de Leads (Legada) com os novos campos
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS corretor_responsavel_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS data_atribuicao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS origem_distribuicao TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS alerta_inatividade_enviado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ultimo_alerta_inatividade TIMESTAMP WITH TIME ZONE;

-- 3. Tabela de Histórico de Mensagens Normalizada (lead_messages)
CREATE TABLE IF NOT EXISTS public.lead_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    sender TEXT CHECK (sender IN ('client', 'sdr_ia', 'agent_human')) NOT NULL,
    content TEXT NOT NULL,
    external_message_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices otimizados para busca do Gemini e timeline do Dashboard
CREATE INDEX IF NOT EXISTS idx_lead_messages_lookup 
    ON public.lead_messages (tenant_id, lead_id, created_at DESC);

-- 4. Barramento de Eventos (lead_events)
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    event_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_events_timeline 
    ON public.lead_events (tenant_id, lead_id, event_type, created_at DESC);

-- 5. Tabelas de Score Dinâmico (score_rules & score_history)
CREATE TABLE IF NOT EXISTS public.score_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_key TEXT NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (tenant_id, rule_key)
);

CREATE TABLE IF NOT EXISTS public.score_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_score_history_lookup 
    ON public.score_history (tenant_id, lead_id, created_at DESC);

-- 6. Tabelas de Observabilidade e DLQ
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID,
    level TEXT CHECK (level IN ('info', 'warn', 'error')) DEFAULT 'info' NOT NULL,
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.failed_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    job_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retries INTEGER DEFAULT 3 NOT NULL,
    status TEXT CHECK (status IN ('pending', 'retrying', 'failed', 'resolved')) DEFAULT 'pending' NOT NULL,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_retry 
    ON public.failed_jobs (status, next_retry_at);

-- 7. Tabela de Regras de Negócio e SLAs (business_rules)
CREATE TABLE IF NOT EXISTS public.business_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    horario_inicio TIME DEFAULT '08:00:00' NOT NULL,
    horario_fim TIME DEFAULT '18:00:00' NOT NULL,
    dias_ativos INTEGER[] DEFAULT '{1,2,3,4,5}' NOT NULL,
    limite_inatividade_horas INTEGER DEFAULT 48 NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Trigger de Coexistência (Escrita Dupla de JSONB para lead_messages)
CREATE OR REPLACE FUNCTION sync_legacy_jsonb_to_messages()
RETURNS TRIGGER AS $$
DECLARE
    legacy_len INT;
    new_len INT;
    diff_idx INT;
    msg_row JSONB;
    v_sender TEXT;
    v_content TEXT;
    v_ext_id TEXT;
BEGIN
    -- Prevenção de loop
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Obter os comprimentos
    legacy_len := COALESCE(jsonb_array_length(OLD.historico_mensagens), 0);
    new_len := COALESCE(jsonb_array_length(NEW.historico_mensagens), 0);

    -- Se não há novas mensagens, nada a fazer
    IF new_len <= legacy_len THEN
        RETURN NEW;
    END IF;

    -- Sincronizar diferença incremental
    FOR diff_idx IN legacy_len .. (new_len - 1) LOOP
        msg_row := NEW.historico_mensagens -> diff_idx;
        v_sender := COALESCE(msg_row ->> 'sender', msg_row ->> 'role');
        v_content := msg_row ->> 'content';
        v_ext_id := msg_row ->> 'id';

        -- Tratar nulos do id externo gerando um hash único se necessário
        IF v_ext_id IS NULL THEN
            v_ext_id := 'legacy_' || NEW.id::text || '_' || diff_idx::text;
        END IF;

        -- Normalizar sender
        IF v_sender = 'user' OR v_sender = 'client' THEN 
            v_sender := 'client';
        ELSIF v_sender = 'assistant' OR v_sender = 'sdr_ia' THEN 
            v_sender := 'sdr_ia';
        ELSE 
            v_sender := 'agent_human';
        END IF;

        INSERT INTO public.lead_messages (tenant_id, lead_id, sender, content, external_message_id)
        VALUES (NEW.tenant_id, NEW.id, v_sender, v_content, v_ext_id)
        ON CONFLICT (external_message_id) DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar se já existir para recriação limpa
DROP TRIGGER IF EXISTS trg_sync_legacy_jsonb ON public.leads;

CREATE TRIGGER trg_sync_legacy_jsonb
    AFTER UPDATE OF historico_mensagens ON public.leads
    FOR EACH ROW
    WHEN (NEW.historico_mensagens IS DISTINCT FROM OLD.historico_mensagens)
    EXECUTE FUNCTION sync_legacy_jsonb_to_messages();
