import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('token/', { username, password });
      login(res.data.access);
      navigate('/workspaces');
    } catch (err) {
      setError('Credenciales inválidas. Verifica tu usuario y contraseña.');
    }
  };

  const pageStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', width: '100vw', margin: 0,
    background: 'radial-gradient(circle at top, #1a2a42 0%, #0d1117 100%)',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#ffffff'
  };

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
    padding: '40px', width: '100%', maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', boxSizing: 'border-box'
  };

  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '8px', 
    border: '1px solid rgba(255, 255, 255, 0.2)', 
    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={pageStyle}>
      <div style={glassCardStyle}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ color: '#4da3ff' }}>AVIO</span>
            <div style={{ width: '14px', height: '14px', background: 'conic-gradient(#4da3ff, transparent)', borderRadius: '50%' }}></div>
            <span style={{ color: '#00e6b8' }}>TRADE</span>
          </h1>
          <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>Acceso a espacios de trabajo</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Usuario / Correo</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
            <span 
  onClick={() => alert('Por favor, ponte en contacto con tu desarrollador o administrador del sistema para restablecer tu acceso.')} 
  style={{ fontSize: '11px', color: '#4da3ff', cursor: 'pointer' }}
>
  ¿Olvidaste tu contraseña?
</span>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={inputStyle} 
            />
          </div>

          {error && <div style={{ color: '#ff4d4d', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" style={{ background: 'linear-gradient(90deg, #4da3ff 0%, #00e6b8 100%)', color: '#0d1117', border: 'none', padding: '14px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '8px', marginTop: '10px', fontSize: '15px', boxShadow: '0 4px 15px rgba(0, 230, 184, 0.2)' }}>
            Ingresar
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <span style={{ color: '#8b949e', fontSize: '13px' }}>¿No tienes una cuenta? </span>
          <button 
            type="button" 
            onClick={() => navigate('/register')} 
            style={{ background: 'transparent', border: 'none', color: '#00e6b8', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', padding: 0 }}
          >
            Regístrate aquí
          </button>
        </div>

      </div>
    </div>
  );
}