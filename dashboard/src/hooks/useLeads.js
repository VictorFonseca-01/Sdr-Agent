import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    fetchLeads(true);

    const leadsSubscription = supabase
      .channel('leads-board-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        console.log('Realtime Event received on Leads Kanban!', payload);
        fetchLeads(false);
        toast.success("Nova mensagem ou lead processado! Kanban sincronizado.", {
          description: "Os dados foram atualizados automaticamente via Supabase Realtime.",
          duration: 4000
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSubscription);
    };
  }, []);

  const getDaysSinceLastInteraction = (dateString) => {
    if (!dateString) return 0;
    const lastInter = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastInter);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isLeadLost = (lead) => {
    if (!lead.ultima_interacao) return false;
    const diffDays = getDaysSinceLastInteraction(lead.ultima_interacao);
    const isInactive = diffDays >= 3;
    const isNotClosed = !lead.status_funil?.toLowerCase().includes('pronto');
    return isInactive && isNotClosed;
  };

  const getLeadColumn = (lead) => {
    if (isLeadLost(lead)) return 'perdido';
    const status = (lead.status_funil || '').toLowerCase();
    const temp = (lead.temperatura || '').toLowerCase();
    
    if (status.includes('pronto') || temp.includes('pronto')) return 'pronto';
    if (status.includes('quente') || temp.includes('quente') || temp.includes('hot')) return 'quente';
    if (status.includes('qualificando') || status.includes('coletando') || status.includes('morno') || temp.includes('morno') || temp.includes('warm')) return 'morno';
    return 'frio'; 
  };

  const updateLeadStatus = async (leadId, novoStatus, novaTemperatura) => {
    const leadName = leads.find(l => l.id === leadId)?.nome || "Lead";
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, temperatura: novaTemperatura, status_funil: novoStatus } : l));
    
    const { error } = await supabase
      .from('leads')
      .update({ temperatura: novaTemperatura, status_funil: novoStatus })
      .eq('id', leadId);

    if (error) {
      toast.error(`Erro ao atualizar status de ${leadName}`);
      fetchLeads(false);
    } else {
      toast.success(`${leadName} atualizado para "${novoStatus}"`);
    }
  };

  return { leads, setLeads, loading, fetchLeads, isLeadLost, getLeadColumn, updateLeadStatus };
}

