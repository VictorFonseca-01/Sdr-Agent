import React, { useState, useEffect } from 'react';
import { Search, LogOut, RefreshCw, BarChart2, Kanban } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import MetricsCards from '../components/MetricsCards';
import KanbanBoard from '../components/KanbanBoard';
import SlideOutPanel from '../components/SlideOutPanel';
import AnalyticsView from '../components/AnalyticsView';
import { supabase } from '../lib/supabase';

export default function Leads() {
  const { leads, fetchLeads, toast, isLeadLost, getLeadColumn, updateLeadStatus } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeLead, setActiveLead] = useState(null);
  const [leadTimelines, setLeadTimelines] = useState({});
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [sortBy, setSortBy] = useState('auto');
  const [isCompact, setIsCompact] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'analytics'
  const [corretores, setCorretores] = useState([]);

  useEffect(() => {
    const fetchCorretores = async () => {
      const { data } = await supabase.from('corretores').select('*');
      if (data) setCorretores(data);
    };
    fetchCorretores();
  }, []);

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

  const uniqueProducts = Array.from(new Set(leads.map(l => l.produto_interesse).filter(Boolean))).sort();

  let filteredLeads = leads;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredLeads = filteredLeads.filter(l => 
      (l.nome && l.nome.toLowerCase().includes(term)) || 
      (l.telefone && l.telefone.includes(term))
    );
  }

  if (filterUrgency !== 'all') {
    filteredLeads = filteredLeads.filter(l => l.nivel_urgencia === filterUrgency);
  }

  if (filterProduct !== 'all') {
    filteredLeads = filteredLeads.filter(l => l.produto_interesse === filterProduct);
  }

  const qualificarLeads = leads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno');
  const quentesLeads = leads.filter(l => getLeadColumn(l) === 'quente');
  const prontosLeads = leads.filter(l => getLeadColumn(l) === 'pronto');
  const perdidosLeads = leads.filter(l => getLeadColumn(l) === 'perdido');

  const kanbanCols = [
    { id: 'frio', title: 'Novos / Frios', color: 'var(--status-frio)' },
    { id: 'morno', title: 'Em Qualificação', color: 'var(--status-morno)' },
    { id: 'quente', title: 'Quentes', color: 'var(--status-quente)' },
    { id: 'pronto', title: 'Prontos para Venda', color: 'var(--status-pronto)' },
    { id: 'perdido', title: 'Perdidos', color: 'var(--status-perdido)' }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1800px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
            SDR Agent Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestão automatizada de leads imobiliários.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="glass-card" style={{ display: 'flex', padding: '4px', gap: '4px', borderRadius: '10px' }}>
          <button 
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Kanban size={16} /> Kanban
          </button>
          <button 
            onClick={() => setViewMode('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'analytics' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'analytics' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <BarChart2 size={16} /> Indicadores & Equipe
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => fetchLeads()} className="glass-card" style={{ padding: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <RefreshCw size={20} />
          </button>
          <button onClick={handleLogout} className="glass-card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--status-perdido)' }}>
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

      {viewMode === 'kanban' ? (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou telefone..."
                className="glass-card"
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Urgency Filter */}
            <div style={{ display: 'flex', minWidth: '150px', flex: 1 }}>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="glass-card"
                style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Urgência: Todas</option>
                <option value="Alta">Urgência: Alta</option>
                <option value="Média">Urgência: Média</option>
                <option value="Baixa">Urgência: Baixa</option>
              </select>
            </div>

            {/* Product Filter */}
            <div style={{ display: 'flex', minWidth: '150px', flex: 1 }}>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="glass-card"
                style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Produto: Todos</option>
                {uniqueProducts.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>

            {/* Sort Controls */}
            <div style={{ display: 'flex', minWidth: '220px', flex: 1 }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-card"
                style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="auto">Ordenar: Inteligente (Urgência + Score)</option>
                <option value="score">Ordenar: Score (Maior primeiro)</option>
                <option value="recent">Ordenar: Recentes primeiro</option>
              </select>
            </div>

            {/* Compact Toggle */}
            <div style={{ display: 'flex', minWidth: '165px', flex: '0 0 auto' }}>
              <button
                onClick={() => setIsCompact(!isCompact)}
                className="glass-card"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: isCompact ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                  color: isCompact ? 'var(--primary)' : 'var(--text-main)',
                  border: isCompact ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isCompact ? '📱 Modo Normal' : '🗂️ Modo Compacto'}
              </button>
            </div>
          </div>

          <KanbanBoard 
            cols={
              filterStatus === 'all' 
                ? kanbanCols 
                : filterStatus === 'qualificar' 
                  ? kanbanCols.filter(c => c.id === 'frio' || c.id === 'morno') 
                  : kanbanCols.filter(c => c.id === filterStatus)
            }
            filteredLeads={filteredLeads}
            getLeadColumn={getLeadColumn}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragStart={handleDragStart}
            onSelectLead={handleSelectLead}
            sortBy={sortBy}
            onOpenWhatsApp={openWhatsApp}
            isCompact={isCompact}
          />
        </>
      ) : (
        <AnalyticsView 
          leads={leads}
          corretores={corretores}
          getLeadColumn={getLeadColumn}
          filterStatus={filterStatus}
        />
      )}

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