import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import ScanHistory from './pages/ScanHistory';
import Vulnerabilities from './pages/Vulnerabilities';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/scans" replace />} />
        <Route path="scan/:scanId" element={<Dashboard />} />
        <Route path="scans" element={<ScanHistory />} />
        <Route path="new" element={<NewScan />} />
        <Route path="scan/:scanId/vulnerabilities" element={<Vulnerabilities />} />
        <Route path="scan/:scanId/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
