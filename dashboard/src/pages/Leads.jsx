import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, MessageSquare, TrendingUp, Search, 
  Filter, Phone, ExternalLink, RefreshCw, LogOut,
  ChevronDown, ChevronUp, Sparkles, MapPin, DollarSign, Target, ArrowRight, UserCheck, Info, UserX, AlertTriangle, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedLeads, setExpandedLeads] = useState({});
  const [activeKpiDropdown, setActiveKpiDropdown] = useState(null);
  const [leadTimelines, setLeadTimelines] = useState({});
  const [webhookLoading, setWebhookLoading] = useState({});

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

  useEffect(() => {
    fetchLeads(true);

    const handleGlobalClick = () => {
      setActiveKpiDropdown(null);
    };
    window.addEventListener('click', handleGlobalClick);

    const interval = setInterval(() => {
      fetchLeads(false);
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
    if (showLoading) setLoading(false);
  };

  const toggleExpand = (leadId) => {
    const isExpanding = !expandedLeads[leadId];
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: isExpanding
    }));
    if (isExpanding) {
      fetchTimeline(leadId);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  const openWhatsApp = (phone, name) => {
    const message = `Olá ${name || ''}, como podemos ajudar?`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getDaysSinceLastInteraction = (dateString) => {
    if (!dateString) return 0;
    const lastInter = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastInter);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isLeadLost = (lead) => {
    if (!lead.ultima_interacao) return false;
    const diffDays = getDaysSinceLastInteraction(lead.ultima_interacao);
    const isInactive = diffDays >= 3;
    const isNotClosed = !lead.status_funil?.toLowerCase().includes('pronto');
    return isInactive && isNotClosed;
  };

  // Funções de Webhook
  const triggerWebhook = async (leadId, type) => {
    setWebhookLoading(prev => ({ ...prev, [`${leadId}-${type}`]: true }));
    try {
      const url = type === 'ia' 
        ? 'https://victorfonseca123.app.n8n.cloud/webhook/qualificar-ia'
        : 'https://victorfonseca123.app.n8n.cloud/webhook/notificar-vendedor';
        
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId })
      });
      // Poderiamos adicionar um toast de sucesso aqui
    } catch (e) {
      console.error("Erro ao chamar webhook:", e);
    }
    setWebhookLoading(prev => ({ ...prev, [`${leadId}-${type}`]: false }));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, lead, colId) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('sourceCol', colId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, destColId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const sourceCol = e.dataTransfer.getData('sourceCol');
    
    if (!leadId || sourceCol === destColId || destColId === 'perdido') return;

    let novaTemperatura = '';
    let novoStatus = '';

    if (destColId === 'frio') { novaTemperatura = 'Frio'; novoStatus = 'Novo'; }
    else if (destColId === 'morno') { novaTemperatura = 'Morno'; novoStatus = 'Qualificando'; }
    else if (destColId === 'quente') { novaTemperatura = 'Quente'; novoStatus = 'Quente'; }
    else if (destColId === 'pronto') { novaTemperatura = 'Pronto para Vendas'; novoStatus = 'Pronto para Vendas'; }

    // Atualiza otimista a UI
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, temperatura: novaTemperatura, status_funil: novoStatus } : l));

    // Atualiza o banco de dados
    await supabase.from('leads').update({ temperatura: novaTemperatura, status_funil: novoStatus }).eq('id', leadId);

    // Automations (Opcional): disparar webhooks automaticamente ao dropar
    if (destColId === 'morno' || destColId === 'quente') {
      triggerWebhook(leadId, 'ia');
    } else if (destColId === 'pronto') {
      triggerWebhook(leadId, 'vendedor');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.telefone?.includes(searchTerm));
    
    if (filterStatus === 'perdido') return matchesSearch && isLeadLost(lead);
    if (filterStatus === 'qualificar') return matchesSearch && (lead.temperatura?.toLowerCase() === 'frio' || lead.temperatura?.toLowerCase() === 'morno' || lead.temperatura?.toLowerCase() === 'cold' || lead.temperatura?.toLowerCase() === 'warm') && !isLeadLost(lead);
    if (filterStatus === 'quente') return matchesSearch && (lead.temperatura?.toLowerCase() === 'quente' || lead.temperatura?.toLowerCase() === 'hot') && !isLeadLost(lead);
    if (filterStatus === 'pronto') return matchesSearch && (lead.status_funil?.toLowerCase().includes('pronto') || lead.temperatura?.toLowerCase().includes('pronto')) && !isLeadLost(lead);
    
    const matchesStatus = filterStatus === 'all' || 
                          lead.status_funil?.toLowerCase().includes(filterStatus.toLowerCase()) ||
                          lead.temperatura?.toLowerCase().includes(filterStatus.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const qualificarLeads = leads.filter(l => (l.temperatura?.toLowerCase() === 'frio' || l.temperatura?.toLowerCase() === 'morno' || l.temperatura?.toLowerCase() === 'cold' || l.temperatura?.toLowerCase() === 'warm') && !isLeadLost(l));
  const quentesLeads = leads.filter(l => (l.temperatura?.toLowerCase() === 'quente' || l.temperatura?.toLowerCase() === 'hot') && !isLeadLost(l));
  const prontosLeads = leads.filter(l => (l.status_funil?.toLowerCase().includes('pronto') || l.temperatura?.toLowerCase().includes('pronto')) && !isLeadLost(l));
  const perdidosLeads = leads.filter(isLeadLost);

  return (
    <div className="dashboard-container" style={{ padding: '30px', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Dashboard de Leads</h1>
          <p style={{ color: 'var(--text-muted)' }}>Controle de fluxo e atendimento</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => fetchLeads(true)} className="glass-card" style={{ padding: '10px', color: 'white', cursor: 'pointer' }}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="glass-card" style={{ padding: '10px 20px', color: '#f87171', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px', position: 'relative', zIndex: 50 }}>
        {/* Total */}
        <div 
          className="glass-card" 
          onClick={() => setFilterStatus('all')}
          style={{ 
            padding: '20px', 
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: filterStatus === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
            boxShadow: filterStatus === 'all' ? '0 0 15px rgba(139, 92, 246, 0.4)' : '',
            transform: filterStatus === 'all' ? 'scale(1.02)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Users style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>Ativos</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{leads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total de Leads</p>
        </div>
        
        {/* Para Qualificar */}
        <div 
          className="glass-card" 
          onClick={() => setFilterStatus('qualificar')}
          style={{ 
            padding: '20px', 
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: filterStatus === 'qualificar' ? '2px solid #0ea5e9' : '1px solid var(--border-glass)',
            boxShadow: filterStatus === 'qualificar' ? '0 0 15px rgba(14, 165, 233, 0.4)' : '',
            transform: filterStatus === 'qualificar' ? 'scale(1.02)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <MessageSquare style={{ color: '#0ea5e9' }} />
            <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 'bold' }}>Aguardando</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{qualificarLeads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leads para Qualificar</p>
        </div>

        {/* Quentes */}
        <div 
          className="glass-card" 
          onClick={() => setFilterStatus('quente')}
          style={{ 
            padding: '20px', 
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: filterStatus === 'quente' ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
            boxShadow: filterStatus === 'quente' ? '0 0 15px rgba(245, 158, 11, 0.4)' : '',
            transform: filterStatus === 'quente' ? 'scale(1.02)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <TrendingUp style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold' }}>Oportunidade</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{quentesLeads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leads Quentes</p>
        </div>

        {/* Prontos para Venda */}
        <div 
          className="glass-card" 
          onClick={() => setFilterStatus('pronto')}
          style={{ 
            padding: '20px', 
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: filterStatus === 'pronto' ? '2px solid #10b981' : '1px solid var(--border-glass)',
            boxShadow: filterStatus === 'pronto' ? '0 0 15px rgba(16, 185, 129, 0.4)' : '',
            transform: filterStatus === 'pronto' ? 'scale(1.02)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <UserCheck style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>Faturamento</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{prontosLeads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Prontos para Venda</p>
        </div>

        {/* Perdidos */}
        <div 
          className="glass-card" 
          onClick={() => setFilterStatus('perdido')}
          style={{ 
            padding: '20px', 
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: filterStatus === 'perdido' ? '2px solid #ef4444' : '1px solid var(--border-glass)',
            boxShadow: filterStatus === 'perdido' ? '0 0 15px rgba(239, 68, 68, 0.4)' : '',
            transform: filterStatus === 'perdido' ? 'scale(1.02)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <UserX style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>Atenção</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{perdidosLeads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leads Perdidos</p>
        </div>
      </div>

      {/* Filters & Search */}
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
        <select 
          className="glass-card"
          style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', outline: 'none', cursor: 'pointer' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Todos os Status</option>
          <option value="qualificar" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Para Qualificar</option>
          <option value="frio" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Frio</option>
          <option value="morno" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Morno</option>
          <option value="quente" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Quente</option>
          <option value="pronto" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Pronto</option>
          <option value="qualificando" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Qualificando</option>
          <option value="perdido" style={{ backgroundColor: '#1e1e24', color: 'white' }}>Perdido</option>
        </select>
      </div>

      {filterStatus !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Filtro ativo:</span>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '20px', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border-glass)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {filterStatus === 'qualificar' && 'Leads para Qualificar'}
            {filterStatus === 'quente' && 'Leads Quentes'}
            {filterStatus === 'pronto' && 'Prontos para Venda'}
            {filterStatus === 'perdido' && 'Leads Perdidos'}
            {!['qualificar', 'quente', 'pronto', 'perdido'].includes(filterStatus) && filterStatus}
            <button 
              onClick={() => setFilterStatus('all')}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', padding: 0, lineHeight: 1, display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}
              title="Limpar filtro"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '60vh' }}>
        {['frio', 'morno', 'quente', 'pronto', 'perdido'].map(colId => {
          if (colId === 'perdido' && filterStatus !== 'all' && filterStatus !== 'perdido') return null;

          const colTitle = colId === 'frio' ? 'Novos / Frios' : 
                           colId === 'morno' ? 'Em Qualificação' : 
                           colId === 'quente' ? 'Quentes' : 
                           colId === 'pronto' ? 'Prontos para Venda' : 'Perdidos';
          
          const colColor = colId === 'frio' ? 'var(--text-muted)' : 
                           colId === 'morno' ? '#0ea5e9' : 
                           colId === 'quente' ? '#f59e0b' : 
                           colId === 'pronto' ? '#10b981' : '#ef4444';

          const colLeads = filteredLeads.filter(l => {
            const isLost = isLeadLost(l);
            if (colId === 'perdido') return isLost;
            if (isLost) return false;
            if (colId === 'pronto') return l.status_funil?.toLowerCase().includes('pronto') || l.temperatura?.toLowerCase().includes('pronto');
            if (colId === 'quente') return l.temperatura?.toLowerCase() === 'quente' || l.temperatura?.toLowerCase() === 'hot';
            if (colId === 'morno') return l.temperatura?.toLowerCase() === 'morno' || l.temperatura?.toLowerCase() === 'warm';
            return !l.temperatura || l.temperatura?.toLowerCase() === 'frio' || l.temperatura?.toLowerCase() === 'cold';
          });

          if (colId === 'perdido' && colLeads.length === 0) return null;

          return (
            <div 
              key={colId} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, colId)}
              style={{ 
                flex: '0 0 350px', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: colColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {colTitle}
                </h3>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{colLeads.length}</span>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, maxHeight: '70vh' }}>
                <AnimatePresence>
                  {colLeads.map(lead => (
                    <motion.div 
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead, colId)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => toggleExpand(lead.id)}
                      className="glass-card"
                      style={{ 
                        padding: '16px', 
                        cursor: 'grab', 
                        position: 'relative', 
                        borderLeft: \`4px solid \${colColor}\`, 
                        background: expandedLeads[lead.id] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        boxShadow: expandedLeads[lead.id] ? \`0 0 15px \${colColor}33\` : 'none',
                        transition: 'background 0.3s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{lead.nome || 'Sem Nome'}</div>
                        {lead.score_qualificacao && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {lead.score_qualificacao}%
                          </div>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14}/> {lead.telefone}
                      </div>
                      
                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: expandedLeads[lead.id] ? '16px' : '0' }}>
                        {lead.produto_interesse && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>{lead.produto_interesse}</span>}
                        {lead.orcamento && <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>{lead.orcamento}</span>}
                      </div>

                      {/* Expanded Details */}
                      {expandedLeads[lead.id] && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'default' }}
                        >
                          {/* Ações Manuais Webhook */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => triggerWebhook(lead.id, 'ia')}
                              disabled={webhookLoading[`\${lead.id}-ia`]}
                              className="glass-card" 
                              style={{ 
                                padding: '8px', fontSize: '0.75rem', flex: 1, color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid rgba(14, 165, 233, 0.3)' 
                              }}
                            >
                              {webhookLoading[`\${lead.id}-ia`] ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14}/>}
                              Qualificar c/ IA
                            </button>
                            <button 
                              onClick={() => triggerWebhook(lead.id, 'vendedor')}
                              disabled={webhookLoading[`\${lead.id}-vendedor`]}
                              className="glass-card" 
                              style={{ 
                                padding: '8px', fontSize: '0.75rem', flex: 1, color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' 
                              }}
                            >
                              {webhookLoading[`\${lead.id}-vendedor`] ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                              Notificar Vendedor
                            </button>
                          </div>

                          <div>
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                              <Sparkles size={16}/> Resumo SDR (IA)
                            </div>
                            <div style={{ color: 'var(--text-main)', lineHeight: '1.5', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                              {lead.resumo_sdr || 'Ainda sem resumo. O SDR IA gerará um após a primeira qualificação.'}
                            </div>
                          </div>
                          
                          {/* Timeline / Messages */}
                          <div>
                            <div style={{ color: '#0ea5e9', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                              <MessageSquare size={16}/> Histórico de Interações
                            </div>
                            <div style={{ 
                              maxHeight: '300px', 
                              overflowY: 'auto', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '10px', 
                              padding: '12px',
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              {!leadTimelines[lead.id] ? (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                  <RefreshCw size={16} className="animate-spin" style={{ margin: '0 auto', marginBottom: '8px' }} />
                                  Carregando histórico...
                                </div>
                              ) : leadTimelines[lead.id].length === 0 ? (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                  Nenhuma interação registrada.
                                </div>
                              ) : (
                                leadTimelines[lead.id].map((item, i) => {
                                  if (item.type === 'event') {
                                    return (
                                      <div key={'evt-'+i} style={{ fontSize: '0.75rem', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0' }}>
                                        {item.description} - {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                      </div>
                                    );
                                  }
                                  
                                  const isClient = item.sender === 'client' || item.sender === 'user' || item.sender === 'lead';
                                  return (
                                    <div key={'msg-'+i} style={{ 
                                      alignSelf: isClient ? 'flex-end' : 'flex-start',
                                      background: isClient ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                      color: 'white',
                                      padding: '10px 14px',
                                      borderRadius: '12px',
                                      borderBottomRightRadius: isClient ? '2px' : '12px',
                                      borderBottomLeftRadius: !isClient ? '2px' : '12px',
                                      maxWidth: '90%',
                                      fontSize: '0.9rem',
                                      lineHeight: '1.4',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}>
                                      {item.content}
                                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '6px', textAlign: isClient ? 'right' : 'left' }}>
                                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        {!isClient && ' • SDR IA'}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleExpand(lead.id); }}
                              className="glass-card" 
                              style={{ padding: '10px', fontSize: '0.85rem', flex: 1, color: 'white', cursor: 'pointer' }}
                            >
                              Recolher
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.telefone, lead.nome); }}
                              className="btn-primary" 
                              style={{ padding: '10px', fontSize: '0.85rem', flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                              <Phone size={16} /> Abrir WhatsApp
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colLeads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}