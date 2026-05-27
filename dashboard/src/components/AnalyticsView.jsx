import React from 'react';
import { TrendingUp, Users, Compass, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AnalyticsView({ leads, corretores, getLeadColumn, filterStatus = 'all' }) {
  // Filter leads based on selected KPI card
  const filteredLeadsForCharts = React.useMemo(() => {
    if (filterStatus === 'all') return leads;
    if (filterStatus === 'qualificar') {
      return leads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno');
    }
    return leads.filter(l => getLeadColumn(l) === filterStatus);
  }, [leads, filterStatus, getLeadColumn]);

  // 1. Conversion Funnel Calculation
  const total = filteredLeadsForCharts.length || 1;
  const colCounts = {
    frio: filteredLeadsForCharts.filter(l => getLeadColumn(l) === 'frio').length,
    morno: filteredLeadsForCharts.filter(l => getLeadColumn(l) === 'morno').length,
    quente: filteredLeadsForCharts.filter(l => getLeadColumn(l) === 'quente').length,
    pronto: filteredLeadsForCharts.filter(l => getLeadColumn(l) === 'pronto').length,
    perdido: filteredLeadsForCharts.filter(l => getLeadColumn(l) === 'perdido').length,
  };

  const funnelData = [
    { name: 'Novos / Frios', count: colCounts.frio, color: 'var(--status-frio)' },
    { name: 'Em Qualificação', count: colCounts.morno, color: 'var(--status-morno)' },
    { name: 'Quentes', count: colCounts.quente, color: 'var(--status-quente)' },
    { name: 'Prontos para Venda', count: colCounts.pronto, color: 'var(--status-pronto)' }
  ];

  // 2. Origins Calculation
  const originsMap = {};
  filteredLeadsForCharts.forEach(l => {
    const origin = l.origem || 'Não Identificado';
    originsMap[origin] = (originsMap[origin] || 0) + 1;
  });
  const originsData = Object.entries(originsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxOriginCount = Math.max(...originsData.map(o => o.count), 1);

  // Sort brokers based on active KPI filter
  const sortedCorretores = React.useMemo(() => {
    return [...corretores].sort((a, b) => {
      const aLeads = leads.filter(l => l.corretor_responsavel_id === a.id);
      const bLeads = leads.filter(l => l.corretor_responsavel_id === b.id);

      let aCount = 0;
      let bCount = 0;

      if (filterStatus === 'all') {
        aCount = aLeads.filter(l => getLeadColumn(l) !== 'perdido').length;
        bCount = bLeads.filter(l => getLeadColumn(l) !== 'perdido').length;
      } else if (filterStatus === 'qualificar') {
        aCount = aLeads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno').length;
        bCount = bLeads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno').length;
      } else {
        aCount = aLeads.filter(l => getLeadColumn(l) === filterStatus).length;
        bCount = bLeads.filter(l => getLeadColumn(l) === filterStatus).length;
      }

      return bCount - aCount;
    });
  }, [corretores, leads, filterStatus, getLeadColumn]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
      
      {/* Upper Grid: Funnel & Origins */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Funnel Widget */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            Funil de Conversão Comercial
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {funnelData.map((stage, idx) => {
              const percentage = Math.round((stage.count / total) * 100);
              return (
                <div key={stage.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{stage.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <strong>{stage.count}</strong> leads ({percentage}%)
                    </span>
                  </div>
                  
                  {/* Visual funnel bar with indent for effect */}
                  <div style={{ 
                    width: '100%', 
                    height: '24px', 
                    background: 'var(--border-color)', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: `${idx * 4}%` // Creating cascade funnel effect
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(percentage, 3)}%`,
                      background: `linear-gradient(90deg, ${stage.color}aa, ${stage.color})`,
                      borderRadius: '4px',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Origins Widget */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
            <Compass size={20} style={{ color: 'var(--secondary)' }} />
            Distribuição de Leads por Origem
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {originsData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Nenhuma origem identificada</p>
            ) : (
              originsData.map(origin => {
                const percentage = Math.round((origin.count / total) * 100);
                const barWidth = Math.round((origin.count / maxOriginCount) * 100);
                return (
                  <div key={origin.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {origin.name}
                    </div>
                    <div style={{ flex: 1, height: '14px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        borderRadius: '10px'
                      }} />
                    </div>
                    <div style={{ width: '80px', fontSize: '0.85rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                      <strong>{origin.count}</strong> ({percentage}%)
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Lower Row: Broker Statistics & Workload */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '24px' }}>
          <Users size={20} style={{ color: 'var(--status-pronto)' }} />
          Distribuição da Equipe (Carga de Corretores)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {sortedCorretores.map(broker => {
            const brokerLeads = leads.filter(l => l.corretor_responsavel_id === broker.id);
            const activeLeadsCount = brokerLeads.filter(l => getLeadColumn(l) !== 'perdido').length;
            const hotLeadsCount = brokerLeads.filter(l => getLeadColumn(l) === 'quente').length;
            const readyLeadsCount = brokerLeads.filter(l => getLeadColumn(l) === 'pronto').length;

            return (
              <div 
                key={broker.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>{broker.nome}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prioridade: {broker.prioridade}</span>
                  </div>
                  
                  {broker.disponibilidade ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--status-pronto)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      <CheckCircle size={12} /> Disponível
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--status-perdido)', background: 'rgba(220, 38, 38, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      <AlertTriangle size={12} /> Ocupado
                    </span>
                  )}
                </div>

                {/* Lead metrics bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{activeLeadsCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LEADS ATIVOS</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--status-quente)' }}>{hotLeadsCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>QUENTES</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--status-pronto)' }}>{readyLeadsCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRONTOS</div>
                  </div>
                </div>

                {/* Workload distribution visualization */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Carga de Trabalho (Temperatura de Leads)</div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    {/* Frios/Mornos */}
                    <div style={{ 
                      height: '100%', 
                      width: `${(brokerLeads.filter(l => getLeadColumn(l) === 'frio' || getLeadColumn(l) === 'morno').length / (brokerLeads.length || 1)) * 100}%`, 
                      background: 'var(--status-morno)' 
                    }} />
                    {/* Quentes */}
                    <div style={{ 
                      height: '100%', 
                      width: `${(hotLeadsCount / (brokerLeads.length || 1)) * 100}%`, 
                      background: 'var(--status-quente)' 
                    }} />
                    {/* Prontos */}
                    <div style={{ 
                      height: '100%', 
                      width: `${(readyLeadsCount / (brokerLeads.length || 1)) * 100}%`, 
                      background: 'var(--status-pronto)' 
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
