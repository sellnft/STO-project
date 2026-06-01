import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

function getToken() {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
}

function AdminDashboard() {
  const [repairs, setRepairs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [owners, setOwners] = useState([]);
  const [activeTab, setActiveTab] = useState('repairs');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchRepairs = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/admin/repairs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка загрузки заявок');
      const data = await response.json();
      setRepairs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchEmployees = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/admin/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка загрузки механиков');
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchOwners = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/admin/owners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка загрузки владельцев');
      const data = await response.json();
      setOwners(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    if (activeTab === 'repairs') await fetchRepairs();
    if (activeTab === 'employees') await fetchEmployees();
    if (activeTab === 'owners') await fetchOwners();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const cancelRepair = async (repairId) => {
    const token = getToken();
    if (!confirm('Вы уверены, что хотите отменить эту заявку?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/repairs/${repairId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Ошибка отмены заявки');
      setSuccessMessage('Заявка успешно отменена');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchRepairs();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const fireEmployee = async (employeeId, employeeName) => {
    const token = getToken();
    
    if (!confirm(`Вы уверены, что хотите уволить механика ${employeeName}?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка при увольнении');
      }
      
      setSuccessMessage(`Механик ${employeeName} уволен успешно`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchEmployees();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

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

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: '1400px', width: '100%' }}>
        <h1>СТО</h1>
        <h2>Админ-панель</h2>
        
        {successMessage && (
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            color: '#065f46',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            color: '#b91c1c',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #c9ced6' }}>
          <button
            onClick={() => setActiveTab('repairs')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'repairs' ? '#0f6fc6' : 'transparent',
              color: activeTab === 'repairs' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px 6px 0 0'
            }}
          >
            Все заявки ({repairs.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'employees' ? '#0f6fc6' : 'transparent',
              color: activeTab === 'employees' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px 6px 0 0'
            }}
          >
            Механики ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'owners' ? '#0f6fc6' : 'transparent',
              color: activeTab === 'owners' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px 6px 0 0'
            }}
          >
            Владельцы ({owners.length})
          </button>
        </div>
        
        <button onClick={fetchData} className="secondary-btn" style={{ marginBottom: '20px' }}>
          Обновить
        </button>
        
        {isLoading && <p className="hint">Загрузка...</p>}
        
        {/* Таблица заявок */}
        {!isLoading && activeTab === 'repairs' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Статус</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Описание</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Марка</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Год</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Цвет</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Госномер</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Владелец</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Механик</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map(repair => (
                  <tr key={repair.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{
                        background: getStatusClass(repair.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'inline-block'
                      }}>
                        {getStatusText(repair.status)}
                      </span>
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', maxWidth: '200px', wordWrap: 'break-word' }}>
                      {repair.description}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.car_brand}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.car_year}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.car_color}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.car_license_plate}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.owner_name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{repair.employee_name || 'Не назначен'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      {repair.status !== 'completed' && repair.status !== 'cancelled' && (
                        <button
                          onClick={() => cancelRepair(repair.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Отменить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Таблица механиков с кнопкой "Уволить" */}
        {!isLoading && activeTab === 'employees' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ID пользователя</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ФИО</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Специализация</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Ранг</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{emp.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{emp.user_id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{emp.full_name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{emp.specialization}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{emp.rank}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => fireEmployee(emp.id, emp.full_name)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Уволить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Таблица владельцев */}
        {!isLoading && activeTab === 'owners' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ID пользователя</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>ФИО</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Телефон</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Адрес</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Серия и номер паспорта</th>
                  <th style={{ borderBottom: '2px solid #c9ced6', padding: '10px', textAlign: 'left' }}>Автомобили</th>
                </tr>
              </thead>
              <tbody>
                {owners.map(owner => (
                  <tr key={owner.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.user_id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.full_name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.phone}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.address}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{owner.passport_number || 'Не указан'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      {owner.cars && owner.cars.length > 0 ? (
                        <div>
                          {owner.cars.map(car => (
                            <div key={car.id} style={{ fontSize: '12px', marginBottom: '4px' }}>
                              {car.brand} ({car.year}) - {car.license_plate}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Нет автомобилей</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;