import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspaces from './pages/Workspaces';
import DocumentEditor from './pages/DocumentEditor';
import AuditLogs from './pages/AuditLogs'; // 1. Importamos el nuevo componente

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/documents/:id" element={<DocumentEditor />} />
          
          {/* 2. Registramos la ruta de la bitácora */}
          <Route path="/audit-logs" element={<AuditLogs />} />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}