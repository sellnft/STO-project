import { useState } from 'react';

function OwnerQuestionnaireModal({
  isOpen,
  fullName,
  onFullNameChange,
  onSubmit,
  onClose,
}) {
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [phone, setPhone] = useState('');
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
    if (nameParts.length < 3) {
      return 'Введите полное ФИО (Фамилия, Имя, Отчество)';
    }
    return '';
  };

  const validateAddress = (value) => {
    if (!value || value.trim() === '') {
      return 'Адрес обязателен';
    }
    if (value.length < 5) {
      return 'Введите корректный адрес';
    }
    return '';
  };

  const validateAge = (value) => {
    if (!value) {
      return 'Возраст обязателен';
    }
    const ageNum = parseInt(value, 10);
    if (isNaN(ageNum)) {
      return 'Возраст должен быть числом';
    }
    if (ageNum < 18) {
      return 'Возраст не может быть меньше 18 лет';
    }
    if (ageNum > 99) {
      return 'Возраст не может быть больше 99 лет';
    }
    return '';
  };

  const validatePassportNumber = (value) => {
    if (!value || value.trim() === '') {
      return 'Номер паспорта обязателен';
    }
    const cleanValue = value.replace(/\s/g, '');
    const passportRegex = /^\d{10}$/;
    if (!passportRegex.test(cleanValue)) {
      return 'Введите 10 цифр паспорта (серия и номер)';
    }
    return '';
  };

  const validatePhone = (value) => {
    if (!value || value.trim() === '') {
      return 'Номер телефона обязателен';
    }
    const cleanValue = value.replace(/[+\s\-()]/g, '');
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(cleanValue)) {
      return 'Введите корректный номер телефона';
    }
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        return validateFullName(value);
      case 'address':
        return validateAddress(value);
      case 'age':
        return validateAge(value);
      case 'passport_number':
        return validatePassportNumber(value);
      case 'phone':
        return validatePhone(value);
      default:
        return '';
    }
  };

  const handleInputChange = (field, value, setter) => {
    setter(value);
    if (touched[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: validateField(field, value)
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

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const newAddress = formData.get('address');
    const newAge = formData.get('age');
    const newPassportNumber = formData.get('passport_number');
    const newPhone = formData.get('phone');
    
    setAddress(newAddress);
    setAge(newAge);
    setPassportNumber(newPassportNumber);
    setPhone(newPhone);
    
    const newErrors = {
      full_name: validateFullName(fullName),
      address: validateAddress(newAddress),
      age: validateAge(newAge),
      passport_number: validatePassportNumber(newPassportNumber),
      phone: validatePhone(newPhone)
    };
    
    setErrors(newErrors);
    setTouched({
      full_name: true,
      address: true,
      age: true,
      passport_number: true,
      phone: true
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
        <h3>Анкета владельца</h3>
        <form onSubmit={handleSubmit} className="form modal-form">
          <label htmlFor="owner-fullname">ФИО</label>
          <input
            id="owner-fullname"
            type="text"
            name="full_name"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            onBlur={() => handleBlur('full_name', fullName)}
            style={inputStyle('full_name')}
            required
          />
          {errors.full_name && touched.full_name && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.full_name}</div>
          )}

          <label htmlFor="owner-address">Адрес</label>
          <input
            id="owner-address"
            type="text"
            name="address"
            onBlur={(e) => handleBlur('address', e.target.value)}
            style={inputStyle('address')}
            required
          />
          {errors.address && touched.address && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.address}</div>
          )}

          <label htmlFor="owner-age">Возраст</label>
          <input
            id="owner-age"
            type="number"
            name="age"
            min="18"
            max="99"
            onBlur={(e) => handleBlur('age', e.target.value)}
            style={inputStyle('age')}
            required
          />
          {errors.age && touched.age && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.age}</div>
          )}

          <label htmlFor="owner-passport">Номер и серия паспорта</label>
          <input
            id="owner-passport"
            type="text"
            name="passport_number"
            placeholder="1234 567890"
            onBlur={(e) => handleBlur('passport_number', e.target.value)}
            style={inputStyle('passport_number')}
            required
          />
          {errors.passport_number && touched.passport_number && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.passport_number}</div>
          )}

          <label htmlFor="owner-phone">Контактный телефон</label>
          <input
            id="owner-phone"
            type="tel"
            name="phone"
            placeholder="+7XXXXXXXXXX"
            onBlur={(e) => handleBlur('phone', e.target.value)}
            style={inputStyle('phone')}
            required
          />
          {errors.phone && touched.phone && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '-5px' }}>{errors.phone}</div>
          )}

          <button type="submit" className="primary-btn">Зарегистрироваться</button>
          <button type="button" className="modal-cancel-btn" onClick={onClose}>Отмена</button>
        </form>
      </section>
    </div>
  );
}

export default OwnerQuestionnaireModal;