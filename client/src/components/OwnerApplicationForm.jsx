import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000';

function OwnerApplicationForm({ onClose, onSuccess }) {
  const [defects, setDefects] = useState([]);
  const [formData, setFormData] = useState({
    brand: '',
    color: '',
    year: new Date().getFullYear(),
    license_plate: '',
    description: '',
    defect_ids: []
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/owner/defects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDefects(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки дефектов:', err);
      }
    };
    
    fetchDefects();
  }, []);

  const validateLicensePlate = (value) => {
    if (!value || value.trim() === '') {
      return 'Государственный номер обязателен';
    }
    
    const cleanValue = value.trim().toUpperCase();
    
    const allowedLetters = /^[АВЕКМНОРСТУХABEKMHOPCTYX]{1}$/;
    const firstChar = cleanValue[0];
    if (!allowedLetters.test(firstChar)) {
      return 'Номер должен начинаться с буквы (А, В, Е, К, М, Н, О, Р, С, Т, У, Х или латиница A, B, E, K, M, H, O, P, C, T, Y, X)';
    }
    
    const digitsPattern = /^\d{3}$/;
    const digits = cleanValue.substring(1, 4);
    if (!digitsPattern.test(digits)) {
      return 'После буквы должны идти 3 цифры';
    }
    
    const secondLetters = cleanValue.substring(4, 6);
    const secondLettersPattern = /^[АВЕКМНОРСТУХABEKMHOPCTYX]{2}$/;
    if (!secondLettersPattern.test(secondLetters)) {
      return 'После цифр должны идти 2 буквы (А, В, Е, К, М, Н, О, Р, С, Т, У, Х)';
    }
    
    const regionPattern = /^\d{2,3}$/;
    const region = cleanValue.substring(6);
    if (!regionPattern.test(region)) {
      return 'В конце должны быть 2 или 3 цифры региона';
    }
    
    if (cleanValue.length < 8 || cleanValue.length > 9) {
      return 'Номер должен содержать 8 или 9 символов (буква + 3 цифры + 2 буквы + 2-3 цифры региона)';
    }
    
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'brand':
        if (!value || value.trim() === '') return 'Марка автомобиля обязательна';
        if (value.length < 2) return 'Марка должна содержать минимум 2 символа';
        return '';
      case 'color':
        if (!value || value.trim() === '') return 'Цвет автомобиля обязателен';
        if (value.length < 2) return 'Цвет должен содержать минимум 2 символа';
        return '';
      case 'year':
        const currentYear = new Date().getFullYear();
        if (!value) return 'Год выпуска обязателен';
        if (value < 1950) return 'Год выпуска не может быть ранее 1950';
        if (value > currentYear + 1) return `Год выпуска не может быть позже ${currentYear + 1}`;
        return '';
      case 'license_plate':
        return validateLicensePlate(value);
      case 'description':
        if (!value || value.trim() === '') return 'Описание проблемы обязательно';
        if (value.length < 10) return 'Описание должно содержать минимум 10 символов';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.brand = validateField('brand', formData.brand);
    newErrors.color = validateField('color', formData.color);
    newErrors.year = validateField('year', formData.year);
    newErrors.license_plate = validateField('license_plate', formData.license_plate);
    newErrors.description = validateField('description', formData.description);
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'license_plate') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || 0 : processedValue
    }));
    
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, processedValue)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, formData[name])
    }));
  };

  const handleDefectChange = (defectId) => {
    setFormData(prev => {
      const newDefectIds = prev.defect_ids.includes(defectId)
        ? prev.defect_ids.filter(id => id !== defectId)
        : [...prev.defect_ids, defectId];
      return { ...prev, defect_ids: newDefectIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    const isFormValid = validateForm();
    if (!isFormValid) {
      return;
    }

    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/owner/new_application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setServerError('Сессия истекла. Пожалуйста, войдите заново.');
        } else if (response.status === 422) {
          if (data.detail && Array.isArray(data.detail)) {
            const apiErrors = {};
            data.detail.forEach(err => {
              const field = err.loc[err.loc.length - 1];
              apiErrors[field] = err.msg;
            });
            setErrors(apiErrors);
            setServerError('Пожалуйста, исправьте ошибки в форме');
          } else {
            setServerError(data.detail || 'Ошибка валидации данных');
          }
        } else if (response.status === 400) {
          setServerError(data.detail || 'Некорректные данные');
        } else {
          setServerError(data.detail || 'Ошибка создания заявки');
        }
        setIsLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setServerError('Не удалось связаться с сервером. Проверьте соединение.');
      setIsLoading(false);
    }
  };

  const inputStyle = (fieldName) => ({
    padding: '10px',
    borderRadius: '10px',
    border: errors[fieldName] && touched[fieldName] ? '2px solid #ef4444' : '1px solid #c7ccd4',
    fontFamily: 'inherit',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Новая заявка</h3>
        {serverError && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '15px',
            color: '#b91c1c',
            fontSize: '14px'
          }}>
            {serverError}
          </div>
        )}
        <form className="form modal-form" onSubmit={handleSubmit}>
          <label htmlFor="brand">Марка автомобиля *</label>
          <input
            id="brand"
            name="brand"
            type="text"
            value={formData.brand}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Например: Toyota"
            style={inputStyle('brand')}
          />
          {errors.brand && touched.brand && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.brand}</div>
          )}

          <label htmlFor="color">Цвет *</label>
          <input
            id="color"
            name="color"
            type="text"
            value={formData.color}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Например: Красный"
            style={inputStyle('color')}
          />
          {errors.color && touched.color && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.color}</div>
          )}

          <label htmlFor="year">Год выпуска *</label>
          <input
            id="year"
            name="year"
            type="number"
            min="1950"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={handleInputChange}
            onBlur={handleBlur}
            style={inputStyle('year')}
          />
          {errors.year && touched.year && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.year}</div>
          )}

          <label htmlFor="license_plate">Госномер *</label>
          <input
            id="license_plate"
            name="license_plate"
            type="text"
            value={formData.license_plate}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Пример: А123ВВ777 или A123BB777"
            style={inputStyle('license_plate')}
          />
          {errors.license_plate && touched.license_plate && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.license_plate}</div>
          )}

          <label htmlFor="description">Описание проблемы *</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Опишите подробнее, что случилось с автомобилем..."
            style={{
              ...inputStyle('description'),
              resize: 'vertical'
            }}
          />
          {errors.description && touched.description && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.description}</div>
          )}

          {defects.length > 0 && (
            <>
              <label>Выберите неисправности (необязательно)</label>
              <div style={{
                border: '1px solid #c7ccd4',
                borderRadius: '10px',
                padding: '12px',
                background: '#ffffff',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {defects.map(defect => (
                  <label
                    key={defect.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.defect_ids.includes(defect.id)}
                      onChange={() => handleDefectChange(defect.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>
                      {defect.name} {defect.work_cost ? `(от ${defect.work_cost} руб.)` : ''}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="primary-btn" disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
              {isLoading ? 'Создание...' : 'Создать заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OwnerApplicationForm;