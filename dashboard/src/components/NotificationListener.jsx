import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function NotificationListener({ session }) {
  useEffect(() => {
    if (!session) return;

    console.log('Iniciando listener de notificações via Supabase Realtime...');

    const leadsSubscription = supabase
      .channel('leads-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const { new: newLead, old: oldLead, eventType } = payload;
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Verifica se o lead precisa de um gerente
            const needsManager = newLead.encaminhar_para_consultor === true || newLead.score_qualificacao >= 80;
            
            // Se for update, verifica se o status mudou ou se antes não precisava de gerente e agora precisa
            const newlyNeedsManager = needsManager && 
              (eventType === 'INSERT' || 
              (eventType === 'UPDATE' && 
                (oldLead.encaminhar_para_consultor !== true && newLead.encaminhar_para_consultor === true) || 
                (oldLead.score_qualificacao < 80 && newLead.score_qualificacao >= 80)
              ));

            if (newlyNeedsManager) {
              toast.success(`Novo Lead Qualificado: ${newLead.nome || newLead.telefone}`, {
                description: 'Este lead atingiu a qualificação necessária ou pediu para falar com um consultor.',
                duration: 8000,
              });
              
              // Tenta tocar um som (pode ser bloqueado pelo navegador se o usuário não interagiu)
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Áudio bloqueado pelo navegador', e));
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSubscription);
    };
  }, [session]);

  return null; // Este componente não renderiza nada visualmente por si só
}
