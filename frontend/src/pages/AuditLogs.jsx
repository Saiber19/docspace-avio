import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get('auditlogs/'); // Asegúrate de que el router en Django use este nombre
      setLogs(res.data);
    } catch (err) {
      console.error('Error al cargar la bitácora:', err);
    } finally {
      setLoading(false);
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
    padding: '30px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    width: '100%', boxSizing: 'border-box'
  };

  const tableHeaderStyle = {
    textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#4da3ff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px'
  };

  const tableCellStyle = {
    padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '13px', color: '#e6edf3'
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '20px' }}>
          <button onClick={() => navigate('/workspaces')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 15px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px' }}>
            ← Volver a Workspaces
          </button>
          <div>
            <h2 style={{ margin: 0, fontWeight: '600', color: '#00e6b8', fontSize: '20px' }}>Bitácora de Auditoría Inmutable</h2>
            <p style={{ margin: '3px 0 0 0', color: '#8b949e', fontSize: '12px' }}>Registro de actividad de la plataforma</p>
          </div>
        </div>

        <div style={glassCardStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#8b949e' }}>Cargando registros...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8b949e' }}>No hay registros de auditoría aún.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Fecha / Hora</th>
                    <th style={tableHeaderStyle}>Usuario</th>
                    <th style={tableHeaderStyle}>Acción</th>
                    <th style={tableHeaderStyle}>Recurso</th>
                    <th style={tableHeaderStyle}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ transition: 'background 0.2s' }}>
                      <td style={tableCellStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{log.user_username || log.user}</td>
                      <td style={tableCellStyle}>
                        <span style={{ 
                          background: 'rgba(0, 230, 184, 0.1)', color: '#00e6b8', 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' 
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={tableCellStyle}>{log.resource_type} (ID: {log.resource_id})</td>
                      <td style={tableCellStyle}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}