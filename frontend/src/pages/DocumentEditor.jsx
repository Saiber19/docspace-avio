import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [compareVersion, setCompareVersion] = useState(null);
  const [userInfo, setUserInfo] = useState({ username: 'Usuario', role: 'Colaborador' });
  
  const [userPermissionLevel, setUserPermissionLevel] = useState('read');
  const [isManagerOrOwner, setIsManagerOrOwner] = useState(false);

  const [collabUsername, setCollabUsername] = useState('');
  const [collabLevel, setCollabLevel] = useState('read');
  const [assigning, setAssigning] = useState(false);

  // Estados para WebSocket de la Fase 2
  const [socket, setSocket] = useState(null);
  const [activeEditor, setActiveEditor] = useState('');

  const { logout } = useAuth();

  useEffect(() => {
    fetchDocumentDetail();
    decodeUserFromToken();
  }, [id]);

  // Hook para conexión WebSocket en tiempo real
  useEffect(() => {
    if (!id || !userInfo.username) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/documents/${id}/`);

    ws.onopen = () => {
        console.log('Conectado al canal colaborativo del documento:', id);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Si el cambio viene de otro usuario, actualizamos
        if (data.username !== userInfo.username) {
            setContent(data.content);
            setActiveEditor(data.username);
            
            // Ocultar el indicador después de 2 segundos de inactividad
            setTimeout(() => setActiveEditor(''), 2000);
        }
    };

    setSocket(ws);

    return () => {
        ws.close();
    };
  }, [id, userInfo.username]);

  const decodeUserFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      
      const isManager = decoded.user_id === 1 || decoded.role === 'Gestor' || decoded.is_staff;
      
      setUserInfo({
        username: decoded.username || (decoded.user_id === 1 ? 'ariel.cortez' : 'Usuario Colaborador'),
        role: isManager ? 'Gestor' : 'Colaborador'
      });
    } catch (err) {
      console.error('Error al decodificar token:', err);
    }
  };

  const fetchDocumentDetail = async () => {
    try {
      const res = await API.get(`documents/${id}/`);
      setDocument(res.data);
      setContent(res.data.content);
      setVersions(res.data.versions || []);

      try {
        const permRes = await API.get(`documents/${id}/my-permission/`);
        setUserPermissionLevel(permRes.data.level);
      } catch (permErr) {
        console.error('Error al verificar permisos:', permErr);
      }

    } catch (err) {
      console.error('Error al cargar el documento:', err);
      setError('Acceso denegado o documento inexistente. No tienes permisos para visualizarlo.');
    }
  };

  // Enviar el contenido tipiado a través del WebSocket
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            content: newContent,
            username: userInfo.username
        }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.patch(`documents/${id}/`, { content });
      setDocument(res.data);
      setContent(res.data.content);
      setVersions(res.data.versions || []);
      alert('¡Nueva versión inmutable generada correctamente!');
    } catch (err) {
      alert('Acceso denegado: Solo cuentas con permisos de lectura en este documento.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('¿Restaurar esta versión? Se anexará como un nuevo registro en el historial.')) return;
    try {
      const res = await API.post(`documents/${id}/restore-version/`, { version_id: versionId });
      setDocument(res.data);
      setContent(res.data.content);
      setVersions(res.data.versions || []);
      alert('¡Restauración exitosa!');
    } catch (err) {
      alert('Acceso denegado: Se requieren permisos de administración para restaurar versiones.');
    }
  };

  const handleAssignPermission = async (e) => {
    e.preventDefault();
    if (!collabUsername.trim()) return;
    setAssigning(true);
    try {
      await API.post(`documents/${id}/assign-permission/`, {
        username: collabUsername,
        level: collabLevel
      });
      alert(`¡Permiso '${collabLevel}' asignado con éxito a ${collabUsername}!`);
      setCollabUsername('');
      fetchDocumentDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al asignar permisos. Verifique sus privilegios de administrador.');
    } finally {
      setAssigning(false);
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
    padding: '25px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '8px', 
    border: '1px solid rgba(255, 255, 255, 0.2)', 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };

  if (error) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...glassCardStyle, textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ color: '#ff4d4d', fontWeight: 'bold', marginBottom: '20px' }}>{error}</p>
          <button onClick={() => navigate('/workspaces')} style={{ padding: '10px 20px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '6px', cursor: 'pointer' }}>
            Volver a Workspaces
          </button>
        </div>
      </div>
    );
  }

  if (!document) return <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando datos del servidor...</div>;

  const canEdit = userInfo.role === 'Gestor' || isManagerOrOwner || userPermissionLevel === 'edit' || userPermissionLevel === 'admin';
  const canManageAccess = userInfo.role === 'Gestor' || isManagerOrOwner || userPermissionLevel === 'admin';

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => navigate('/workspaces')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 15px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px' }}>
              ← Volver
            </button>
            <div>
              <h2 style={{ margin: 0, fontWeight: '600', color: '#00e6b8', fontSize: '20px' }}>{document.title}</h2>
              <p style={{ margin: '3px 0 0 0', color: '#8b949e', fontSize: '12px' }}>ID de Entorno: WS-{document.workspace} | Modo: {canEdit ? 'Edición Habilitada' : 'Solo Lectura (Read-Only)'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>👤 {userInfo.username}</div>
              <div style={{ fontSize: '11px', color: '#00e6b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol: {userInfo.role}</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '8px 16px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={glassCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', color: '#4da3ff', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
                  Contenido del Documento {!canEdit && '(Sólo Lectura)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Indicador de Presencia de la Fase 2 */}
                    {activeEditor && (
                        <span style={{ fontSize: '11px', color: '#00e6b8', fontStyle: 'italic', fontWeight: 'bold', background: 'rgba(0, 230, 184, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                            ✎ {activeEditor} está escribiendo...
                        </span>
                    )}
                    {!canEdit && (
                    <span style={{ fontSize: '11px', background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                        Sin permisos de modificación
                    </span>
                    )}
                </div>
              </div>
              
              <textarea
                value={content}
                onChange={handleContentChange} // Cambiado a la nueva función de WebSocket
                readOnly={!canEdit}
                rows="16"
                style={{ 
                  width: '100%', padding: '20px', fontSize: '14px', 
                  fontFamily: "'Fira Code', 'Courier New', monospace", 
                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', 
                  backgroundColor: canEdit ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)', 
                  color: canEdit ? '#fff' : '#8b949e', outline: 'none', resize: 'vertical', boxSizing: 'border-box' 
                }}
              />
              
              {canEdit ? (
                <button type="submit" disabled={saving} style={{ width: '100%', background: 'linear-gradient(90deg, #4da3ff 0%, #00e6b8 100%)', color: '#0d1117', border: 'none', padding: '14px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px', marginTop: '15px', fontSize: '15px', boxShadow: '0 4px 15px rgba(0, 230, 184, 0.2)' }}>
                  {saving ? 'Procesando...' : 'Comprometer Cambios (Generar Versión)'}
                </button>
              ) : (
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: '#8b949e', fontSize: '13px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  🔒 Este documento está en modo de visualización protegida para tu usuario.
                </div>
              )}
            </div>

            {compareVersion && (
              <div style={{ ...glassCardStyle, border: '1px solid #4da3ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#4da3ff', fontSize: '14px', textTransform: 'uppercase' }}>Comparativa: v{compareVersion.version_number}</h4>
                  <button type="button" onClick={() => setCompareVersion(null)} style={{ background: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✕ Cerrar</button>
                </div>
                <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>Registro: {new Date(compareVersion.created_at).toLocaleString()}</div>
                <textarea
                  readOnly
                  value={compareVersion.content}
                  rows="8"
                  style={{ width: '100%', padding: '15px', fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: '13px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#8b949e', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {canManageAccess ? (
              <div style={glassCardStyle}>
                <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '16px', fontWeight: '600' }}>Control de Accesos</h3>
                <form onSubmit={handleAssignPermission} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Usuario Colaborador</label>
                    <input 
                      type="text" 
                      placeholder="Ej. edgar.cortez" 
                      value={collabUsername} 
                      onChange={(e) => setCollabUsername(e.target.value)} 
                      required 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Nivel de Autorización</label>
                    <select 
                      value={collabLevel} 
                      onChange={(e) => setCollabLevel(e.target.value)} 
                      style={{ ...inputStyle, background: '#1a2a42' }}
                    >
                      <option value="read">Lectura</option>
                      <option value="edit">Lectura y Edición</option>
                      <option value="admin">Administración Total</option>
                    </select>
                  </div>
                  <button type="submit" disabled={assigning} style={{ background: '#00e6b8', color: '#0d1117', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', fontSize: '13px' }}>
                    {assigning ? 'Asignando...' : 'Otorgar Permiso'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={glassCardStyle}>
                <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '16px', fontWeight: '600' }}>Control de Accesos</h3>
                <p style={{ color: '#8b949e', fontSize: '12px', margin: 0 }}>
                  Sección restringida a administradores o gestores del documento.
                </p>
              </div>
            )}

            <div style={glassCardStyle}>
              <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '16px', fontWeight: '600' }}>Bitácora de Versiones</h3>
              {versions.length === 0 ? (
                <p style={{ color: '#8b949e', fontSize: '13px' }}>Sin registros.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '400px', overflowY: 'auto' }}>
                  {versions.map((ver) => (
                    <li key={ver.id} style={{ marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #00e6b8', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: '#fff' }}>v{ver.version_number}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8b949e', margin: '6px 0 10px 0' }}>
                        {new Date(ver.created_at).toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setCompareVersion(ver)} style={{ flex: 1, background: 'rgba(77, 163, 255, 0.1)', color: '#4da3ff', border: '1px solid rgba(77, 163, 255, 0.3)', padding: '6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                          Comparar
                        </button>
                        {canManageAccess && (
                          <button type="button" onClick={() => handleRestoreVersion(ver.id)} style={{ flex: 1, background: 'rgba(0, 230, 184, 0.1)', color: '#00e6b8', border: '1px solid rgba(0, 230, 184, 0.3)', padding: '6px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                            Restaurar
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}