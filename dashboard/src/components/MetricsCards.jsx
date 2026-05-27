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
          border: filterStatus === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
          background: filterStatus === 'all' ? 'rgba(30, 58, 138, 0.05)' : 'var(--bg-card)',
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
          border: filterStatus === 'qualificar' ? '2px solid var(--status-morno)' : '1px solid var(--border-color)',
          background: filterStatus === 'qualificar' ? 'rgba(2, 132, 199, 0.05)' : 'var(--bg-card)',
          transform: filterStatus === 'qualificar' ? 'scale(1.02)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <MessageSquare style={{ color: 'var(--status-morno)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--status-morno)', fontWeight: 'bold' }}>Aguardando</span>
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
          border: filterStatus === 'quente' ? '2px solid var(--status-quente)' : '1px solid var(--border-color)',
          background: filterStatus === 'quente' ? 'rgba(234, 88, 12, 0.05)' : 'var(--bg-card)',
          transform: filterStatus === 'quente' ? 'scale(1.02)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <TrendingUp style={{ color: 'var(--status-quente)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--status-quente)', fontWeight: 'bold' }}>Oportunidade</span>
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
          border: filterStatus === 'pronto' ? '2px solid var(--status-pronto)' : '1px solid var(--border-color)',
          background: filterStatus === 'pronto' ? 'rgba(5, 150, 105, 0.05)' : 'var(--bg-card)',
          transform: filterStatus === 'pronto' ? 'scale(1.02)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <UserCheck style={{ color: 'var(--status-pronto)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--status-pronto)', fontWeight: 'bold' }}>Faturamento</span>
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
          border: filterStatus === 'perdido' ? '2px solid var(--status-perdido)' : '1px solid var(--border-color)',
          background: filterStatus === 'perdido' ? 'rgba(220, 38, 38, 0.05)' : 'var(--bg-card)',
          transform: filterStatus === 'perdido' ? 'scale(1.02)' : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <UserX style={{ color: 'var(--status-perdido)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--status-perdido)', fontWeight: 'bold' }}>Atenção</span>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{perdidosLeads.length}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leads Perdidos</p>
      </div>
    </div>
  );
}
