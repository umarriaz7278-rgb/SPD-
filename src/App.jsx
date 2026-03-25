import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import BiltyCreate from './pages/BiltyCreate';
import Warehouse from './pages/Warehouse';
import ChalanManagement from './pages/ChalanManagement';
import Dashboard from './pages/Dashboard';
import TransitTracking from './pages/TransitTracking';
import LahoreReceiving from './pages/LahoreReceiving';
import LahoreWarehouse from './pages/LahoreWarehouse';
import Claims from './pages/Claims';
import CashLedger from './pages/CashLedger';
import PartyLedger from './pages/PartyLedger';
import BiltyHistory from './pages/BiltyHistory';
import LahoreCashLedger from './pages/LahoreCashLedger';
import BrokerRecord from './pages/BrokerRecord';

// Pages placeholders
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bilty/create" element={<BiltyCreate />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="chalan" element={<ChalanManagement />} />
          <Route path="transit" element={<TransitTracking />} />
          <Route path="lahore" element={<LahoreReceiving />} />
          <Route path="lahore-warehouse" element={<LahoreWarehouse />} />
          <Route path="claims" element={<Claims />} />
          <Route path="ledger/cash" element={<CashLedger />} />
          <Route path="ledger/party" element={<PartyLedger />} />
          <Route path="bilty-history" element={<BiltyHistory />} />
          <Route path="ledger/lahore" element={<LahoreCashLedger />} />
          <Route path="broker-record" element={<BrokerRecord />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
