import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Forzamos el rol 'collaborator' por defecto por seguridad corporativa
      await API.post('users/', {
        username,
        email,
        password,
        role: 'collaborator'
      });
      alert('¡Cuenta de colaborador registrada con éxito! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Error al registrarse. Es posible que el usuario o correo ya existan.');
    }
  };

  const pageStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at top, #1a2a42 0%, #0d1117 100%)',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", color: '#ffffff'
  };

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    boxSizing: 'border-box'
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
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ color: '#4da3ff' }}>AVIO</span>
            <div style={{ width: '14px', height: '14px', background: 'conic-gradient(#4da3ff, transparent)', borderRadius: '50%' }}></div>
            <span style={{ color: '#00e6b8' }}>TRADE</span>
          </h2>
          <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>Registro de Colaborador - DocSpace</p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '8px', color: '#ff4d4d', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Usuario
            </label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="correo@aviotradegroup.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              background: 'linear-gradient(90deg, #4da3ff 0%, #00e6b8 100%)', 
              color: '#0d1117', border: 'none', padding: '14px', 
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', 
              fontSize: '15px', marginTop: '10px', boxShadow: '0 4px 15px rgba(0, 230, 184, 0.2)' 
            }}
          >
            Registrarse como Colaborador
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: '#8b949e' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#00e6b8', textDecoration: 'none', fontWeight: 'bold' }}>
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
}