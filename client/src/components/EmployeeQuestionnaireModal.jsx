import { useState } from 'react';

function EmployeeQuestionnaireModal({
  isOpen,
  fullName,
  specialization,
  rank,
  onFullNameChange,
  onSpecializationChange,
  onRankChange,
  onSubmit,
  onClose,
}) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  if (!isOpen) {
    return null;
  }

  const validateFullName = (value) => {
    if (!value || value.trim() === '') {
      return 'ФИО обязательно';
    }
    const nameParts = value.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return 'Введите полное ФИО (минимум 2 слова)';
    }
    if (value.length < 10) {
      return 'Введите корректное ФИО';
    }
    return '';
  };

  const validateSpecialization = (value) => {
    if (!value || value.trim() === '') {
      return 'Специализация обязательна';
    }
    if (value.length < 3) {
      return 'Специализация должна содержать минимум 3 символа';
    }
    return '';
  };

  const validateRank = (value) => {
    if (!value) {
      return 'Ранг обязателен';
    }
    const rankNum = parseInt(value, 10);
    if (isNaN(rankNum)) {
      return 'Ранг должен быть числом';
    }
    if (rankNum < 1) {
      return 'Ранг не может быть меньше 1';
    }
    if (rankNum > 10) {
      return 'Ранг не может быть больше 10';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        return validateFullName(value);
      case 'specialization':
        return validateSpecialization(value);
      case 'rank':
        return validateRank(value);
      default:
        return '';
    }
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateField(field, value)
    }));
  };

  const handleFullNameChange = (value) => {
    onFullNameChange(value);
    if (touched.full_name) {
      setErrors(prev => ({ ...prev, full_name: validateFullName(value) }));
    }
  };

  const handleSpecializationChange = (value) => {
    onSpecializationChange(value);
    if (touched.specialization) {
      setErrors(prev => ({ ...prev, specialization: validateSpecialization(value) }));
    }
  };

  const handleRankChange = (value) => {
    onRankChange(value);
    if (touched.rank) {
      setErrors(prev => ({ ...prev, rank: validateRank(value) }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const newErrors = {
      full_name: validateFullName(fullName),
      specialization: validateSpecialization(specialization),
      rank: validateRank(rank)
    };
    
    setErrors(newErrors);
    setTouched({
      full_name: true,
      specialization: true,
      rank: true
    });
    
    const isValid = !Object.values(newErrors).some(error => error !== '');
    
    if (isValid) {
      onSubmit(event);
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
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>Анкета механика</h3>
        <form onSubmit={handleSubmit} className="form modal-form">
          <label htmlFor="employee-fullname">ФИО</label>
          <input
            id="employee-fullname"
            type="text"
            name="full_name"
            value={fullName}
            onChange={(event) => handleFullNameChange(event.target.value)}
            onBlur={() => handleBlur('full_name', fullName)}
            style={inputStyle('full_name')}
            required
          />
          {errors.full_name && touched.full_name && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.full_name}</div>
          )}

          <label htmlFor="employee-specialization">Специализация</label>
          <input
            id="employee-specialization"
            type="text"
            name="specialization"
            value={specialization}
            onChange={(event) => handleSpecializationChange(event.target.value)}
            onBlur={() => handleBlur('specialization', specialization)}
            style={inputStyle('specialization')}
            required
          />
          {errors.specialization && touched.specialization && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.specialization}</div>
          )}

          <label htmlFor="employee-rank">Ранг (квалификационный разряд)</label>
          <input
            id="employee-rank"
            type="number"
            name="rank"
            min="1"
            max="10"
            value={rank}
            onChange={(event) => handleRankChange(event.target.value)}
            onBlur={() => handleBlur('rank', rank)}
            style={inputStyle('rank')}
            required
          />
          {errors.rank && touched.rank && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.rank}</div>
          )}

          <button type="submit" className="primary-btn">Зарегистрироваться</button>
          <button type="button" className="modal-cancel-btn" onClick={onClose}>Отмена</button>
        </form>
      </section>
    </div>
  );
}

export default EmployeeQuestionnaireModal;