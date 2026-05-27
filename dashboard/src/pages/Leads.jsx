import React, { useState } from 'react';
import { Search, LogOut, RefreshCw } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import MetricsCards from '../components/MetricsCards';
import KanbanBoard from '../components/KanbanBoard';
import SlideOutPanel from '../components/SlideOutPanel';
import { supabase } from '../lib/supabase';

export default function Leads() {
  const { leads, fetchLeads, toast, isLeadLost, getLeadColumn, updateLeadStatus } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeLead, setActiveLead] = useState(null);
  const [leadTimelines, setLeadTimelines] = useState({});

  const handleLogout = () => supabase.auth.signOut();

  const fetchTimeline = async (leadId) => {
    const { data: messages } = await supabase
      .from('lead_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    const { data: events } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    const unified = [
      ...(messages || []).map(m => ({ ...m, type: 'message' })),
      ...(events || []).map(e => ({ ...e, type: 'event' }))
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    setLeadTimelines(prev => ({
      ...prev,
      [leadId]: unified
    }));
  };

  const handleSelectLead = (lead) => {
    setActiveLead(lead);
    if (!leadTimelines[lead.id]) {
      fetchTimeline(lead.id);
    }
  };

  const handleNotifySeller = async (lead) => {
    try {
      await fetch('https://victorfonseca123.app.n8n.cloud/webhook/notificar-vendedor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'notificar-vendedor', lead_id: lead.id, lead_data: lead })
      });
      toast.success && toast.success('Vendedor notificado com sucesso!');
    } catch (e) {
      console.error(e);
    }
  };

  const openWhatsApp = (phone, name) => {
    const message = `Olá ${name || ''}, como podemos ajudar?`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDragStart = (e, lead, sourceCol) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('sourceCol', sourceCol);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, destColId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId || destColId === 'perdido') return;

    let novaTemperatura = '';
    let novoStatus = '';

    if (destColId === 'frio') { novaTemperatura = 'Frio'; novoStatus = 'Novo'; }
    else if (destColId === 'morno') { novaTemperatura = 'Morno'; novoStatus = 'Qualificando'; }
    else if (destColId === 'quente') { novaTemperatura = 'Quente'; novoStatus = 'Quente'; }
    else if (destColId === 'pronto') { novaTemperatura = 'Pronto para Vendas'; novoStatus = 'Pronto para Vendas'; }

    await updateLeadStatus(leadId, novoStatus, novaTemperatura);
  };

  let filteredLeads = leads;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(l => 
      (l.nome && l.nome.toLowerCase().includes(term)) || 
      (l.telefone && l.telefone.includes(term))
    );
  }

  const qualificarLeads = leads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno');
  const quentesLeads = leads.filter(l => getLeadColumn(l) === 'quente');
  const prontosLeads = leads.filter(l => getLeadColumn(l) === 'pronto');
  const perdidosLeads = leads.filter(l => getLeadColumn(l) === 'perdido');

  const kanbanCols = [
    { id: 'frio', title: 'Novos / Frios', color: 'var(--text-muted)' },
    { id: 'morno', title: 'Em Qualificação', color: '#0ea5e9' },
    { id: 'quente', title: 'Quentes', color: '#f59e0b' },
    { id: 'pronto', title: 'Prontos para Venda', color: '#10b981' },
    { id: 'perdido', title: 'Perdidos', color: '#ef4444' }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1800px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SDR Agent Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestão automatizada de leads imobiliários.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => fetchLeads()} className="glass-card" style={{ padding: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={20} />
          </button>
          <button onClick={handleLogout} className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ef4444' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ 
          position: 'fixed', top: '20px', right: '20px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)'
        }}>
          {toast.message}
        </div>
      )}

      <MetricsCards 
        leads={leads}
        qualificarLeads={qualificarLeads}
        quentesLeads={quentesLeads}
        prontosLeads={prontosLeads}
        perdidosLeads={perdidosLeads}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..."
            className="glass-card"
            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', outline: 'none' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <KanbanBoard 
        cols={kanbanCols.filter(c => filterStatus === 'all' || filterStatus === c.id || (c.id === 'perdido' ? filterStatus === 'perdido' : true))}
        filteredLeads={filteredLeads}
        getLeadColumn={getLeadColumn}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleDragStart={handleDragStart}
        onSelectLead={handleSelectLead}
      />

      <SlideOutPanel 
        lead={activeLead}
        timeline={activeLead ? leadTimelines[activeLead.id] : null}
        onClose={() => setActiveLead(null)}
        onOpenWhatsApp={openWhatsApp}
        onNotifySeller={handleNotifySeller}
      />
    </div>
  );
}