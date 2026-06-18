import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import HotelsPage from './pages/HotelsPage';
import PromoCodesPage from './pages/PromoCodesPage';
import DisputesPage from './pages/DisputesPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/promo-codes" element={<PromoCodesPage />} />
        <Route path="/disputes" element={<DisputesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
