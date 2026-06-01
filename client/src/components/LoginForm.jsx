import { useState } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const validateForm = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Введите юзернейм';
    }
    if (!password.trim()) {
      errors.password = 'Введите пароль';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE}/register/login`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          setError('Неверный юзернейм или пароль');
        } else {
          setError(data.detail || 'Ошибка входа');
        }
        setIsLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('access_token', data.access_token);
      } else {
        sessionStorage.setItem('access_token', data.access_token);
      }
      
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      const userRole = payload.role;
      
      if (userRole === 'owner') {
        navigateTo('/owner');
      } else if (userRole === 'mechanic') {
        navigateTo('/mechanic');
      } else if (userRole === 'admin') {
        navigateTo('/admin');
      } else {
        navigateTo('/');
      }
      
    } catch (err) {
      setError('Не удалось связаться с сервером');
      setIsLoading(false);
    }
  };

  const inputStyle = (fieldName) => ({
    padding: '10px',
    borderRadius: '10px',
    border: fieldErrors[fieldName] ? '2px solid #ef4444' : '1px solid #c7ccd4',
    fontFamily: 'inherit',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#ffffff'
  });

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="login-username" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
          Юзернейм
        </label>
        <input
          id="login-username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' });
          }}
          style={inputStyle('username')}
          placeholder="Введите ваш юзернейм"
        />
        {fieldErrors.username && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            {fieldErrors.username}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="login-password" style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
          Пароль
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
          }}
          style={inputStyle('password')}
          placeholder="Введите ваш пароль"
        />
        {fieldErrors.password && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
            {fieldErrors.password}
          </div>
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '14px', color: '#4b5563' }}>Запомнить меня</span>
      </label>

      <button 
        type="submit" 
        className="primary-btn" 
        disabled={isLoading}
        style={{ 
          opacity: isLoading ? 0.6 : 1, 
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s'
        }}
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          color: '#b91c1c',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <span style={{ fontWeight: 'bold' }}>⚠️ Ошибка</span>: {error}
        </div>
      )}
    </form>
  );
}

export default LoginForm;