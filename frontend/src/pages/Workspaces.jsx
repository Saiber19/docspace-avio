import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [userInfo, setUserInfo] = useState({ username: 'Usuario', role: 'Colaborador' });
  
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    decodeUserFromToken();
    fetchData();
  }, []);

  const decodeUserFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        console.log("Token decodificado:", decoded);

        // Si el usuario es id 1 o staff o su username es ariel.cortez, es Gestor
        const isManager = decoded.user_id === 1 || decoded.is_staff || decoded.role === 'Gestor';
        
        setUserInfo({
          username: decoded.username || (decoded.user_id === 1 ? 'ariel.cortez' : 'Usuario Avio'),
          role: isManager ? 'Gestor' : 'Colaborador'
        });
      }
    } catch (err) {
      console.error('Error al decodificar token:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [wsRes, docRes] = await Promise.all([
        API.get('workspaces/'),
        API.get('documents/')
      ]);
      setWorkspaces(wsRes.data);
      setDocuments(docRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      await API.post('workspaces/', { name: newWorkspaceName });
      setNewWorkspaceName('');
      fetchData();
      alert('¡Espacio de trabajo creado con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || 'Acceso denegado: Solo los gestores pueden crear espacios de trabajo.');
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !selectedWorkspace) {
      alert('Selecciona un Workspace y escribe un título para el documento.');
      return;
    }
    try {
      await API.post('documents/', {
        title: newDocTitle,
        workspace: selectedWorkspace,
        content: 'Documento nuevo creado desde DocSpace.'
      });
      setNewDocTitle('');
      fetchData();
      alert('¡Documento creado con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || 'Acceso denegado: Solo los gestores pueden crear documentos en el sistema.');
    }
  };

  const pageStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto',
    background: 'radial-gradient(circle at top, #1a2a42 0%, #0d1117 100%)',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#ffffff'
  };

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
    padding: '30px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '8px', 
    border: '1px solid rgba(255, 255, 255, 0.2)', 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };

  const isManager = userInfo.role === 'Gestor';

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', boxSizing: 'border-box' }}>
        
        {/* Header Superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255,255,255,0.02)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#4da3ff' }}>AVIO</span>
              <div style={{ width: '14px', height: '14px', background: 'conic-gradient(#4da3ff, transparent)', borderRadius: '50%' }}></div>
              <span style={{ color: '#00e6b8' }}>TRADE</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            {isManager && (
              <button onClick={() => navigate('/audit-logs')} style={{ background: 'rgba(77, 163, 255, 0.1)', color: '#4da3ff', border: '1px solid rgba(77, 163, 255, 0.3)', padding: '8px 16px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                📋 Ver Bitácora de Auditoría
              </button>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>👤 {userInfo.username}</div>
              <div style={{ fontSize: '11px', color: '#00e6b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol: {userInfo.role}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Panel de Control Principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Workspaces */}
          <div style={glassCardStyle}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', fontWeight: '600' }}>Espacios de Trabajo</h3>
            
            {isManager && (
              <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <input 
                  type="text" 
                  placeholder="Nombre del nuevo workspace" 
                  value={newWorkspaceName} 
                  onChange={(e) => setNewWorkspaceName(e.target.value)} 
                  style={inputStyle} 
                />
                <button type="submit" style={{ background: '#00e6b8', color: '#0d1117', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Crear
                </button>
              </form>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
              {workspaces.map((ws) => (
                <li key={ws.id} style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#fff' }}>{ws.name}</strong>
                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>Propietario: {ws.owner_username || 'Sistema'}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentos del Sistema */}
          <div style={glassCardStyle}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', fontWeight: '600' }}>Documentos del Sistema</h3>
            
            {isManager && (
              <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                <select 
                  value={selectedWorkspace} 
                  onChange={(e) => setSelectedWorkspace(e.target.value)} 
                  style={{ ...inputStyle, background: '#1a2a42', cursor: 'pointer' }}
                >
                  <option value="">Selecciona un Workspace</option>
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Título del documento" 
                    value={newDocTitle} 
                    onChange={(e) => setNewDocTitle(e.target.value)} 
                    style={inputStyle} 
                  />
                  <button type="submit" style={{ background: '#4da3ff', color: '#0d1117', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Nuevo Doc
                  </button>
                </div>
              </form>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
              {documents.map((doc) => (
                <li key={doc.id} onClick={() => navigate(`/documents/${doc.id}`)} style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#00e6b8' }}>{doc.title}</strong>
                    <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>Entorno de Trabajo ID: {doc.workspace}</div>
                  </div>
                  <span style={{ background: 'rgba(77, 163, 255, 0.1)', color: '#4da3ff', border: '1px solid rgba(77, 163, 255, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    v{doc.versions ? doc.versions.length : 1}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}