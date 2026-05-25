import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, MessageSquare, TrendingUp, Search, 
  Filter, Phone, ExternalLink, RefreshCw, LogOut,
  ChevronDown, ChevronUp, Sparkles, MapPin, DollarSign, Target, ArrowRight, UserCheck, Info, UserX, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedLeads, setExpandedLeads] = useState({});
  const [activeKpiDropdown, setActiveKpiDropdown] = useState(null);
  const [kpiSearch, setKpiSearch] = useState('');

  useEffect(() => {
    fetchLeads(true);

    const handleGlobalClick = () => {
      setActiveKpiDropdown(null);
    };
    window.addEventListener('click', handleGlobalClick);

    // Auto-refresh silencioso a cada 30 segundos
    const interval = setInterval(() => {
      fetchLeads(false);
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const scrollToAndExpandLead = (leadId) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: true
    }));
    
    setTimeout(() => {
      const element = document.getElementById(`lead-row-${leadId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash visual highlight
        element.style.background = 'rgba(139, 92, 246, 0.2)';
        setTimeout(() => {
          element.style.background = '';
        }, 1500);
      }
    }, 100);
    setActiveKpiDropdown(null);
  };

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
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const handleLogout = () => supabase.auth.signOut();

  const getTemperatureBadge = (temp) => {
    const t = temp?.toLowerCase();
    if (t === 'quente' || t === 'hot') return 'badge-hot';
    if (t === 'morno' || t === 'warm') return 'badge-warm';
    return 'badge-cold';
  };

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
    
    // Considerado perdido se passar de 3 dias sem atendimento e não foi finalizada a venda
    const isInactive = diffDays >= 3;
    const isNotClosed = !lead.status_funil?.toLowerCase().includes('pronto');
    return isInactive && isNotClosed;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.telefone?.includes(searchTerm));
    
    if (filterStatus === 'perdido') {
      return matchesSearch && isLeadLost(lead);
    }

    if (filterStatus === 'qualificar') {
      return matchesSearch && (lead.temperatura?.toLowerCase() === 'frio' || lead.temperatura?.toLowerCase() === 'morno' || lead.temperatura?.toLowerCase() === 'cold' || lead.temperatura?.toLowerCase() === 'warm') && !isLeadLost(lead);
    }

    if (filterStatus === 'quente') {
      return matchesSearch && (lead.temperatura?.toLowerCase() === 'quente' || lead.temperatura?.toLowerCase() === 'hot') && !isLeadLost(lead);
    }

    if (filterStatus === 'pronto') {
      return matchesSearch && (lead.status_funil?.toLowerCase().includes('pronto') || lead.temperatura?.toLowerCase().includes('pronto')) && !isLeadLost(lead);
    }
    
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
    <div className="dashboard-container" style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
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

      {/* Leads Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Lead</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Temperatura</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Qualidade do Lead
                    <div className="tooltip-container">
                      <Info size={14} style={{ color: 'var(--text-muted)' }} />
                      <div className="tooltip-box">
                        Percentual que indica o nível de interesse e compatibilidade do lead com base no perfil e comportamento analisados pela IA.
                      </div>
                    </div>
                  </div>
                </th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <motion.tr 
                      id={`lead-row-${lead.id}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }}
                      onClick={() => toggleExpand(lead.id)}
                      className="lead-row"
                    >
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {expandedLeads[lead.id] ? <ChevronUp size={18} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={18} />}
                          </span>
                          <div>
                            <div style={{ fontWeight: '600' }}>{lead.nome || 'Sem Nome'}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lead.telefone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{lead.status_funil}</span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`badge ${getTemperatureBadge(lead.temperatura)}`}>
                            {lead.temperatura || 'Frio'}
                          </span>
                          {isLeadLost(lead) && (
                            <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              Perdido
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(lead.score_qualificacao || 0, 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {lead.score_qualificacao || 0}%
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Qualidade do lead
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => toggleExpand(lead.id)}
                            className="glass-card" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'white' }}
                          >
                            {expandedLeads[lead.id] ? 'Recolher' : 'Expandir'}
                          </button>
                          <button 
                            onClick={() => openWhatsApp(lead.telefone, lead.nome)}
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Phone size={14} /> WhatsApp
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {expandedLeads[lead.id] && (
                      <tr key={`${lead.id}-details`}>
                        <td colSpan={5} style={{ padding: '0 20px 20px 20px', background: 'rgba(255,255,255,0.01)' }}>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              padding: '20px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--border-glass)',
                              borderRadius: '12px',
                              marginTop: '5px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '20px'
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {/* Alerta de Lead Perdido */}
                                {isLeadLost(lead) && (
                                  <div style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    gridColumn: '1 / -1'
                                  }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#f87171', fontWeight: '700', margin: 0 }}>
                                      <AlertTriangle size={16} /> Lead Perdido por Falta de Atendimento
                                    </h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                                      Este lead foi classificado como <strong>Perdido</strong> pois permaneceu sem atendimento ou interação há <strong>{getDaysSinceLastInteraction(lead.ultima_interacao)} dias</strong> (limite tolerável: 3 dias). Última atividade registrada em {new Date(lead.ultima_interacao).toLocaleDateString('pt-BR')}.
                                    </p>
                                  </div>
                                )}

                                {/* IA Insights Card */}
                                <div style={{
                                  background: 'rgba(139, 92, 246, 0.05)',
                                  border: '1px solid rgba(139, 92, 246, 0.1)',
                                  padding: '16px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}>
                                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--primary)', fontWeight: '700', margin: 0 }}>
                                    <Sparkles size={16} /> Resumo SDR (IA)
                                  </h4>
                                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4', margin: 0 }}>
                                    {lead.resumo_sdr || 'Sem resumo de qualificação disponível no momento.'}
                                  </p>
                                </div>

                                {/* Preferences Card */}
                                <div style={{
                                  background: 'rgba(255, 255, 255, 0.01)',
                                  border: '1px solid var(--border-glass)',
                                  padding: '16px',
                                  borderRadius: '8px',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '12px'
                                }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Target size={12} /> Produto de Interesse
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                                      {lead.produto_interesse || 'Não especificado'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <DollarSign size={12} /> Orçamento
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px', color: '#10b981' }}>
                                      {lead.orcamento || 'Não informado'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <DollarSign size={12} /> Entrada Disponível
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                                      {lead.valor_entrada || 'Não informada'}
                                    </div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <MapPin size={12} /> Região de Interesse
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '2px' }}>
                                      {lead.regiao_interesse || 'Não informada'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Action items inside expand details */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--border-glass)',
                                paddingTop: '12px',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <ArrowRight size={16} style={{ color: 'var(--accent)' }} />
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Próxima Ação:</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{lead.proxima_acao || 'Aguardando próxima interação'}</span>
                                </div>

                                {lead.encaminhar_para_consultor && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    color: '#34d399',
                                    fontWeight: '600'
                                  }}>
                                    <UserCheck size={14} /> Encaminhar para Consultor
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum lead encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
