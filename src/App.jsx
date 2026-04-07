import React, { useState, useEffect } from 'react';
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
import MainOwnerCashLedger from './pages/MainOwnerCashLedger';
import HammadCashLedger from './pages/HammadCashLedger';
import BrokerRecord from './pages/BrokerRecord';
import Invoices from './pages/Invoices';
import VehicleManagement from './pages/VehicleManagement';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('spd_auth') === 'true'
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Layout />
          </ProtectedRoute>
        }>
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
          <Route path="ledger/main-owner" element={<MainOwnerCashLedger />} />
          <Route path="ledger/hammad" element={<HammadCashLedger />} />
          <Route path="broker-record" element={<BrokerRecord />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="vehicles" element={<VehicleManagement />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
