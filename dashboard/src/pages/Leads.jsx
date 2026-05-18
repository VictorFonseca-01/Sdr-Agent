import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, MessageSquare, TrendingUp, Search, 
  Filter, Phone, ExternalLink, RefreshCw, LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLeads(data);
    setLoading(false);
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.telefone?.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || lead.status_funil === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-container" style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Dashboard de Leads</h1>
          <p style={{ color: 'var(--text-muted)' }}>Controle de fluxo e atendimento</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchLeads} className="glass-card" style={{ padding: '10px', color: 'white', cursor: 'pointer' }}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="glass-card" style={{ padding: '10px 20px', color: '#f87171', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <Users style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>+12%</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{leads.length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total de Leads</p>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <TrendingUp style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{leads.filter(l => l.temperatura?.toLowerCase() === 'quente').length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Leads Quentes</p>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <MessageSquare style={{ color: 'var(--accent)' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{leads.filter(l => l.status_funil === 'qualificando').length}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Em Qualificação</p>
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
          style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-glass)', outline: 'none' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos os Status</option>
          <option value="frio">Frio</option>
          <option value="morno">Morno</option>
          <option value="quente">Quente</option>
          <option value="pronto">Pronto</option>
          <option value="qualificando">Qualificando</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Lead</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Temperatura</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Score</th>
                <th style={{ padding: '20px', color: 'var(--text-muted)', fontWeight: '600' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredLeads.map((lead) => (
                  <motion.tr 
                    key={lead.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}
                    className="lead-row"
                  >
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '600' }}>{lead.nome || 'Sem Nome'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{lead.telefone}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{lead.status_funil}</span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span className={`badge ${getTemperatureBadge(lead.temperatura)}`}>
                        {lead.temperatura || 'Frio'}
                      </span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ width: '100px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(lead.score_qualificacao * 10, 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
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
