import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

function getToken() {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
}

function CompleteRepairForm({ repairId, onComplete, onCancel }) {
  const [workCost, setWorkCost] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateWorkCost = (value) => {
    if (value === '' || value === null || value === undefined) {
      return '';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Введите корректное число';
    }
    if (numValue < 0) {
      return 'Стоимость не может быть отрицательной';
    }
    if (numValue > 10000000) {
      return 'Стоимость не может превышать 10 000 000 руб.';
    }
    return '';
  };

  const validatePartsCost = (value) => {
    if (value === '' || value === null || value === undefined) {
      return '';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Введите корректное число';
    }
    if (numValue < 0) {
      return 'Стоимость не может быть отрицательной';
    }
    if (numValue > 10000000) {
      return 'Стоимость не может превышать 10 000 000 руб.';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'workCost':
        return validateWorkCost(value);
      case 'partsCost':
        return validatePartsCost(value);
      default:
        return '';
    }
  };

  const validateForm = () => {
    const workError = validateWorkCost(workCost);
    const partsError = validatePartsCost(partsCost);
    const newErrors = {
      workCost: workError,
      partsCost: partsError
    };
    setErrors(newErrors);
    
    const workValue = workCost === '' ? 0 : parseFloat(workCost);
    const partsValue = partsCost === '' ? 0 : parseFloat(partsCost);
    
    if ((workValue === 0 && partsValue === 0) && workError === '' && partsError === '') {
      setErrors(prev => ({ ...prev, form: 'Укажите стоимость работ или запчастей' }));
      return false;
    }
    
    return workError === '' && partsError === '';
  };

  const handleInputChange = (field, value) => {
    if (field === 'workCost') setWorkCost(value);
    if (field === 'partsCost') setPartsCost(value);
    
    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateField(field, value),
        form: ''
      }));
    }
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  const handleSubmit = async () => {
    setServerError('');
    setErrors(prev => ({ ...prev, form: '' }));
    
    const isValid = validateForm();
    if (!isValid) {
      return;
    }
    
    const workValue = workCost === '' ? 0 : parseFloat(workCost);
    const partsValue = partsCost === '' ? 0 : parseFloat(partsCost);
    
    setIsSubmitting(true);
    try {
      await onComplete(repairId, { work_cost: workValue, parts_cost: partsValue });
    } catch (err) {
      setServerError(err.message || 'Ошибка при завершении ремонта');
      setIsSubmitting(false);
    }
  };

  const inputStyle = (fieldName) => ({
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: errors[fieldName] && touched[fieldName] ? '2px solid #ef4444' : '1px solid #c9ced6',
    fontSize: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  });

  return (
    <div style={{ 
      marginTop: '16px', 
      paddingTop: '16px', 
      borderTop: '2px solid #0f6fc6',
      backgroundColor: '#f0f9ff',
      padding: '16px',
      borderRadius: '8px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#0f6fc6' }}>Завершение ремонта</h4>
      
      {serverError && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '15px',
          color: '#b91c1c',
          fontSize: '14px'
        }}>
          {serverError}
        </div>
      )}
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
          Стоимость работ (руб.):
        </label>
        <input
          type="number"
          value={workCost}
          onChange={(e) => handleInputChange('workCost', e.target.value)}
          onBlur={() => handleBlur('workCost', workCost)}
          placeholder="Введите стоимость работ"
          autoFocus
          style={inputStyle('workCost')}
          disabled={isSubmitting}
        />
        {errors.workCost && touched.workCost && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.workCost}</div>
        )}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
          Стоимость запчастей (руб.):
        </label>
        <input
          type="number"
          value={partsCost}
          onChange={(e) => handleInputChange('partsCost', e.target.value)}
          onBlur={() => handleBlur('partsCost', partsCost)}
          placeholder="Введите стоимость запчастей"
          style={inputStyle('partsCost')}
          disabled={isSubmitting}
        />
        {errors.partsCost && touched.partsCost && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.partsCost}</div>
        )}
      </div>
      
      {errors.form && (
        <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{errors.form}</div>
      )}
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleSubmit} 
          style={{ 
            flex: 1,
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px',
            border: 'none',
            borderRadius: '6px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isSubmitting ? 0.6 : 1
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Завершение...' : 'Подтвердить завершение'}
        </button>
        <button 
          onClick={onCancel} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          disabled={isSubmitting}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function MechanicDashboard() {
  const [availableRepairs, setAvailableRepairs] = useState([]);
  const [myRepairs, setMyRepairs] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingRepairId, setCompletingRepairId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAvailable = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/mechanic/available-applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите заново.');
        return;
      }
      
      if (!response.ok) throw new Error('Ошибка загрузки доступных заявок');
      
      const data = await response.json();
      setAvailableRepairs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMyRepairs = async () => {
    const token = getToken();
    try {
      const response = await fetch(`${API_BASE}/mechanic/my-applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите заново.');
        return;
      }
      
      if (!response.ok) throw new Error('Ошибка загрузки моих заявок');
      
      const data = await response.json();
      setMyRepairs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    setActionError('');
    setActionSuccess('');
    await Promise.all([fetchAvailable(), fetchMyRepairs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const takeApplication = async (repairId) => {
    const token = getToken();
    setActionError('');
    setActionSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/mechanic/take-application/${repairId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const errorData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(errorData.detail || 'Заявка уже взята другим механиком');
        }
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
        }
        throw new Error(errorData.detail || 'Ошибка при взятии заявки');
      }
      
      setActionSuccess('Заявка успешно взята в работу');
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchData();
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(''), 5000);
    }
  };

  const completeApplication = async (repairId, costs) => {
    const token = getToken();
    setActionError('');
    setActionSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/mechanic/end-application/${repairId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          work_cost: costs.work_cost,
          parts_cost: costs.parts_cost
        })
      });
      
      const errorData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(errorData.detail || 'Заявка не в статусе "в работе"');
        }
        if (response.status === 403) {
          throw new Error(errorData.detail || 'У вас нет прав для завершения этой заявки');
        }
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите заново.');
        }
        throw new Error(errorData.detail || 'Ошибка при завершении ремонта');
      }
      
      setCompletingRepairId(null);
      setActionSuccess('Ремонт успешно завершён');
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchData();
    } catch (err) {
      throw err;
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

  const RepairCard = ({ repair, isMy }) => (
    <div style={{
      border: '1px solid #c9ced6',
      borderRadius: '10px',
      padding: '14px',
      background: '#ffffff',
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
          Заявка #{repair.id}
        </span>
        <span style={{
          background: getStatusClass(repair.status),
          color: 'white',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {getStatusText(repair.status)}
        </span>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Автомобиль:</strong> {repair.car_brand}
      </div>
      
      <div style={{ marginBottom: '4px', fontSize: '14px', color: '#4b5563' }}>
        <strong>Год:</strong> {repair.car_year} | <strong>Госномер:</strong> {repair.car_license_plate}
      </div>
      
      <div style={{ marginBottom: '8px', marginTop: '8px' }}>
        <strong>Описание проблемы:</strong>
        <p style={{ margin: '4px 0 0 0', color: '#4b5563' }}>{repair.description}</p>
      </div>
      
      {repair.defects && repair.defects.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Выбранные неисправности:</strong>
          <ul style={{ margin: '4px 0 0 20px', color: '#4b5563' }}>
            {repair.defects.map((defect, idx) => (
              <li key={idx}>{defect}</li>
            ))}
          </ul>
        </div>
      )}
      
      {repair.start_date && (
        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
          <strong>Начало работ:</strong> {new Date(repair.start_date).toLocaleString()}
        </div>
      )}
      
      {repair.end_date && (
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <strong>Окончание:</strong> {new Date(repair.end_date).toLocaleString()}
        </div>
      )}
      
      {(repair.work_cost || repair.parts_cost) && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
          {repair.work_cost > 0 && <div><strong>Стоимость работ:</strong> {repair.work_cost.toLocaleString()} руб.</div>}
          {repair.parts_cost > 0 && <div><strong>Стоимость запчастей:</strong> {repair.parts_cost.toLocaleString()} руб.</div>}
        </div>
      )}
      
      {isMy && repair.status === 'in_progress' && completingRepairId === repair.id && (
        <CompleteRepairForm
          repairId={repair.id}
          onComplete={completeApplication}
          onCancel={() => setCompletingRepairId(null)}
        />
      )}
      
      {!isMy && repair.status === 'pending' && (
        <button
          onClick={() => takeApplication(repair.id)}
          className="primary-btn"
          style={{ marginTop: '12px', width: '100%' }}
        >
          Взять в работу
        </button>
      )}
      
      {isMy && repair.status === 'in_progress' && completingRepairId !== repair.id && (
        <button
          onClick={() => setCompletingRepairId(repair.id)}
          className="primary-btn"
          style={{ marginTop: '12px', width: '100%' }}
        >
          Завершить ремонт
        </button>
      )}
    </div>
  );

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: '900px' }}>
        <h1>СТО</h1>
        <h2>Панель механика</h2>
        
        {actionSuccess && (
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
            {actionSuccess}
          </div>
        )}
        
        {actionError && (
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
            {actionError}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #c9ced6' }}>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'available' ? '#0f6fc6' : 'transparent',
              color: activeTab === 'available' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px 6px 0 0'
            }}
          >
            Доступные заявки ({availableRepairs.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'my' ? '#0f6fc6' : 'transparent',
              color: activeTab === 'my' ? 'white' : '#111827',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px 6px 0 0'
            }}
          >
            Мои заявки ({myRepairs.length})
          </button>
        </div>
        
        <button onClick={fetchData} className="secondary-btn" style={{ marginBottom: '20px' }}>
          Обновить
        </button>
        
        {isLoading && <p className="hint">Загрузка...</p>}
        {error && <p className="error-text">{error}</p>}
        
        {!isLoading && activeTab === 'available' && availableRepairs.length === 0 && (
          <p className="hint">Нет доступных заявок</p>
        )}
        
        {!isLoading && activeTab === 'available' && availableRepairs.length > 0 && (
          <div>
            {availableRepairs.map(repair => (
              <RepairCard key={repair.id} repair={repair} isMy={false} />
            ))}
          </div>
        )}
        
        {!isLoading && activeTab === 'my' && myRepairs.length === 0 && (
          <p className="hint">У вас пока нет взятых заявок</p>
        )}
        
        {!isLoading && activeTab === 'my' && myRepairs.length > 0 && (
          <div>
            {myRepairs.map(repair => (
              <RepairCard key={repair.id} repair={repair} isMy={true} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MechanicDashboard;