import React from 'react';
import { Users, MessageSquare, TrendingUp, UserCheck, UserX } from 'lucide-react';

export default function MetricsCards({ 
  leads, 
  qualificarLeads, 
  quentesLeads, 
  prontosLeads, 
  perdidosLeads, 
  filterStatus, 
  setFilterStatus 
}) {
  return (
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
  );
}
