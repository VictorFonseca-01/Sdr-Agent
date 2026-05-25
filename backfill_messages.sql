DO $$
DECLARE
    r RECORD;
    msg_row JSONB;
    v_sender TEXT;
    v_content TEXT;
    v_ext_id TEXT;
    v_idx INT;
    v_count INT := 0;
    v_total_leads INT := 0;
    v_migrated_msgs INT := 0;
BEGIN
    RAISE NOTICE 'Iniciando migração de mensagens históricas (Backfill)...';

    -- Loop por todos os leads que possuem histórico de mensagens
    FOR r IN 
        SELECT id, tenant_id, historico_mensagens 
        FROM public.leads 
        WHERE historico_mensagens IS NOT NULL AND jsonb_array_length(historico_mensagens) > 0
    LOOP
        v_total_leads := v_total_leads + 1;
        
        -- Loop pelo array de mensagens do lead
        FOR v_idx IN 0 .. (jsonb_array_length(r.historico_mensagens) - 1) LOOP
            msg_row := r.historico_mensagens -> v_idx;
            v_sender := COALESCE(msg_row ->> 'sender', msg_row ->> 'role');
            v_content := msg_row ->> 'content';
            v_ext_id := msg_row ->> 'id';

            -- Gerar ID externo se nulo para manter unicidade na migração
            IF v_ext_id IS NULL THEN
                v_ext_id := 'legacy_' || r.id::text || '_' || v_idx::text;
            END IF;

            -- Normalizar sender
            IF v_sender = 'user' OR v_sender = 'client' THEN 
                v_sender := 'client';
            ELSIF v_sender = 'assistant' OR v_sender = 'sdr_ia' THEN 
                v_sender := 'sdr_ia';
            ELSE 
                v_sender := 'agent_human';
            END IF;

            -- Inserir ignorando duplicados caso a trigger de escrita dupla já tenha pego algumas
            INSERT INTO public.lead_messages (tenant_id, lead_id, sender, content, external_message_id)
            VALUES (r.tenant_id, r.id, v_sender, v_content, v_ext_id)
            ON CONFLICT (external_message_id) DO NOTHING;
            
            v_migrated_msgs := v_migrated_msgs + 1;
        END LOOP;

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Backfill finalizado! Total de leads avaliados: %. Total de mensagens migradas: %.', v_total_leads, v_migrated_msgs;
END;
$$;
