import React from 'react';
import { COMPANY } from '../lib/constants';

const PrintChalan = ({ chalan, bilties }) => {
  return (
    <div className="chalan-print-area" style={{ border: '2px solid #1e3a8a', background: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Company Header */}
      <div className="print-company-header" style={{ background: '#1e3a8a', color: 'white', textAlign: 'center', padding: '1.5rem 2rem', borderBottom: '5px solid #f59e0b' }}>
        <div className="print-company-title-area">
          <div className="print-company-name" style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{COMPANY.name}</div>
          <div className="print-company-tagline" style={{ fontSize: '0.85rem', opacity: 0.9, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem', marginBottom: '0.8rem' }}>Goods Transport Service</div>
        </div>
        <div className="print-company-contact-bar" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', lineHeight: 1.4 }}>
          <div className="print-contact-row"><strong>Office:</strong> {COMPANY.address}</div>
          <div className="print-contact-row"><strong>Ph:</strong> {COMPANY.phones}</div>
          <div className="print-contact-row" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
            <span>📧 {COMPANY.email}</span> | <span>🌐 {COMPANY.website}</span>
          </div>
        </div>
      </div>

      {/* Chalan Strip */}
      <div className="print-chalan-strip" style={{ background: '#f59e0b', color: '#1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1.5rem', fontWeight: 900, fontSize: '0.95rem' }}>
        <span>TRUCK CHALAN / MANIFEST</span>
        <span>Chalan No: <span style={{ fontSize: '1.4rem' }}>#{chalan.chalan_no}</span></span>
        <span>Date: {chalan.chalan_date}</span>
      </div>

      {/* Chalan Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #1e3a8a' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderRight: '2px solid #1e3a8a' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'white', background: '#1e3a8a', padding: '0.2rem 0.5rem', display: 'inline-block', borderRadius: '3px', marginBottom: '0.5rem' }}>🚚 Journey Details</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>From:</strong> {chalan.from_city}</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>To:</strong> {chalan.to_city}</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>Departure:</strong> {chalan.departure_time || '—'}</div>
        </div>
        <div style={{ padding: '0.75rem 1.25rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'white', background: '#1e3a8a', padding: '0.2rem 0.5rem', display: 'inline-block', borderRadius: '3px', marginBottom: '0.5rem' }}>🚛 Vehicle & Driver</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>Truck No:</strong> {chalan.truck_no}</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>Driver Ph:</strong> {chalan.driver_phone || '—'}</div>
          <div style={{ display: 'flex', marginBottom: '0.2rem', fontSize: '0.82rem' }}><strong style={{ width: '100px', color: '#1e3a8a' }}>Route Permit:</strong> {chalan.route_permit_no || '—'}</div>
        </div>
      </div>

      {/* Bilties Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr>
            <th style={{ background: '#1e3a8a', color: 'white', padding: '0.5rem', textAlign: 'left' }}>Bilty #</th>
            <th style={{ background: '#1e3a8a', color: 'white', padding: '0.5rem', textAlign: 'left' }}>Sender</th>
            <th style={{ background: '#1e3a8a', color: 'white', padding: '0.5rem', textAlign: 'center' }}>Loaded Qty</th>
            <th style={{ background: '#1e3a8a', color: 'white', padding: '0.5rem', textAlign: 'center' }}>Payment</th>
            <th style={{ background: '#1e3a8a', color: 'white', padding: '0.5rem', textAlign: 'right' }}>Amount (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {bilties.map((b, i) => {
            // Support both data structures (from loading/inserting)
            const loadedQty = b.loadedQuantity || b.loaded_quantity || 0;
            const totalQty = b.total_quantity || 0;
            const totalAmt = b.total_amount || 0;
            const biltyNo = b.bilty_no || (b.bilties?.bilty_no) || '—';
            const senderName = b.sender_name || (b.bilties?.sender_name) || '—';
            const paymentStatus = b.payment_status || (b.bilties?.payment_status) || '—';

            // Amount calculation logic
            let displayAmt = 0;
            if (totalQty > 0) {
                const ratio = loadedQty / totalQty;
                displayAmt = Math.round(totalAmt * ratio);
            } else if (b.total_amount) {
                // Fallback if we don't have quantities but have amount (though unlikely in this app)
                displayAmt = b.total_amount;
            }

            return (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? 'white' : '#f8faff' }}>
                <td style={{ padding: '0.45rem', fontWeight: 'bold' }}>#{biltyNo}</td>
                <td style={{ padding: '0.45rem' }}>{senderName}</td>
                <td style={{ padding: '0.45rem', textAlign: 'center' }}>{loadedQty}</td>
                <td style={{ padding: '0.45rem', textAlign: 'center' }}>{paymentStatus}</td>
                <td style={{ padding: '0.45rem', textAlign: 'right' }}>{displayAmt.toLocaleString()}</td>
              </tr>
            );
          })}
          <tr style={{ background: '#eff6ff', borderTop: '2px solid #1e3a8a' }}>
            <td colSpan="4" style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a' }}>Total Chalan Amount</td>
            <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a', fontSize: '1.1rem' }}>Rs. {chalan.total_amount?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Signature & Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem 1.5rem', borderTop: '2px solid #1e3a8a', marginTop: '1rem' }}>
        <div style={{ borderTop: '1px solid #aaa', paddingTop: '0.5rem', width: '200px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>Prepared By</div>
        <div style={{ borderTop: '1px solid #aaa', paddingTop: '0.5rem', width: '200px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>Driver Signature</div>
        <div style={{ borderTop: '1px solid #aaa', paddingTop: '0.5rem', width: '200px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>Manager</div>
      </div>
    </div>
  );
};

export default PrintChalan;
