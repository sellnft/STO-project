import { useState, useEffect } from 'react';
import OwnerApplicationForm from './OwnerApplicationForm';

const API_BASE = 'http://127.0.0.1:8000';

function getToken() {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
}

function OwnerDashboard() {
  const [applications, setApplications] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      const token = getToken();
      console.log('Fetching applications...');
      
      const response = await fetch(`${API_BASE}/owner/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received applications:', data);
      setApplications(data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'in_progress': 'В работе',
      'completed': 'Завершён',
      'cancelled': 'Отменён'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': '#f59e0b',
      'in_progress': '#0f6fc6',
      'completed': '#10b981',
      'cancelled': '#ef4444'
    };
    return classMap[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: '800px' }}>
        <h1>СТО</h1>
        <h2>Мои заявки</h2>
        
        <button
          type="button"
          className="primary-btn"
          onClick={() => setIsFormOpen(true)}
          style={{ marginBottom: '20px' }}
        >
          Новая заявка
        </button>

        {isLoading && <p className="hint">Загрузка...</p>}
        
        {error && (
          <div>
            <p className="error-text">{error}</p>
            <button 
              onClick={fetchApplications} 
              className="secondary-btn"
              style={{ marginTop: '10px' }}
            >
              Повторить загрузку
            </button>
          </div>
        )}

        {!isLoading && applications.length === 0 && !error && (
          <p className="hint">У вас пока нет заявок. Создайте первую!</p>
        )}

        {!isLoading && applications.length > 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {applications.map((app, index) => (
                <div
                  key={app.id}
                  style={{
                    border: '1px solid #c9ced6',
                    borderRadius: '10px',
                    padding: '14px',
                    background: '#ffffff'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                      Заявка #{index + 1}
                    </span>
                    <span style={{
                      background: getStatusClass(app.status),
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(app.status)}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '8px', color: '#4b5563' }}>
                    <strong>Авто:</strong> {app.car_brand} • {app.car_license_plate}
                  </div>
                  
                  <div style={{ marginBottom: '8px', color: '#4b5563' }}>
                    <strong>Проблема:</strong> {app.description}
                  </div>
                  
                  {app.employee_name && (
                    <div style={{ marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
                      <strong>Механик:</strong> {app.employee_name}
                    </div>
                  )}
                  
                  {app.start_date && (
                    <div style={{ marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
                      <strong>Начало работ:</strong> {formatDate(app.start_date)}
                    </div>
                  )}
                  
                  {app.end_date && (
                    <div style={{ marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
                      <strong>Окончание:</strong> {formatDate(app.end_date)}
                    </div>
                  )}
                  
                  {(app.work_cost || app.parts_cost) && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                      {app.work_cost && app.work_cost > 0 && (
                        <div><strong>Стоимость работ:</strong> {app.work_cost.toLocaleString()} руб.</div>
                      )}
                      {app.parts_cost && app.parts_cost > 0 && (
                        <div><strong>Стоимость запчастей:</strong> {app.parts_cost.toLocaleString()} руб.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Кнопка обновить внизу под таблицей */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={fetchApplications}
                className="secondary-btn"
                disabled={isLoading}
              >
                Обновить
              </button>
            </div>
          </>
        )}
      </div>

      {isFormOpen && (
        <OwnerApplicationForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchApplications();
          }}
        />
      )}
    </main>
  );
}

export default OwnerDashboard;