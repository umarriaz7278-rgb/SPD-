import React from 'react';
import { COMPANY } from '../lib/constants';

const PrintBrokerStatement = ({ broker }) => {
  if (!broker) return null;

  const totalCommissions = broker.transactions.reduce((s,t) => s + Number(t.commission_amount||0), 0);
  const totalPayments = broker.transactions.reduce((s,t) => s + Number(t.payment_amount||0), 0);
  const currentBalance = totalCommissions - totalPayments;

  // Sort transactions by date ascending for the table
  const sortedTransactions = [...broker.transactions].sort((a,b) => new Date(a.record_date) - new Date(b.record_date));

  return (
    <div className="broker-print-area" style={{ background: 'white', color: 'black', fontFamily: 'Arial, sans-serif', padding: '10mm' }}>
      
      {/* Company Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', color: '#1e3a8a' }}>{COMPANY.name}</div>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Goods Transport Service</div>
        <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
          {COMPANY.address} <br />
          Ph: {COMPANY.phones} | Email: {COMPANY.email}
        </div>
      </div>

      {/* Statement Header */}
      <div style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>Broker Statement</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>{broker.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Generated on: {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>Current Balance</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: currentBalance >= 0 ? '#059669' : '#dc2626' }}>
            Rs {currentBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>Total Earnings</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>Rs {totalCommissions.toLocaleString()}</div>
        </div>
        <div style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>Total Payments Received</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>Rs {totalPayments.toLocaleString()}</div>
        </div>
      </div>

      {/* Ledger Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ background: '#1e3a8a', color: 'white' }}>
            <th style={{ padding: '0.6rem', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '0.6rem', textAlign: 'left' }}>Reference</th>
            <th style={{ padding: '0.6rem', textAlign: 'left' }}>Vehicle Info</th>
            <th style={{ padding: '0.6rem', textAlign: 'right' }}>Commission</th>
            <th style={{ padding: '0.6rem', textAlign: 'right' }}>Payment</th>
            <th style={{ padding: '0.6rem', textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let runningBalance = 0;
            return sortedTransactions.map((t, idx) => {
              const comm = Number(t.commission_amount || 0);
              const pay = Number(t.payment_amount || 0);
              runningBalance += (comm - pay);

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.5rem' }}>{new Date(t.record_date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 700 }}>
                    {t.chalan_no ? `Chalan #${t.chalan_no}` : 'Direct Entry'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {t.vehicle_no ? (
                      <div>
                        <strong>{t.vehicle_no}</strong>
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>{t.route_permit_no || ''}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#666' }}>{t.description}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                    {comm > 0 ? `+${comm.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                    {pay > 0 ? `-${pay.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, background: '#f8fafc' }}>
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
        <div>* This is a computer generated statement.</div>
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#1e3a8a' }}>{COMPANY.name}</div>
      </div>

    </div>
  );
};

export default PrintBrokerStatement;
