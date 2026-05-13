import './App.css'
import { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function PageCard({ title, subtitle, children }) {
  return (
    <section className="card">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      {children}
    </section>
  )
}

function HomePage() {
  return (
    <main className="page">
      <section className="card home-card">
        <h1>СТО</h1>
        <h2>Добро пожаловать</h2>
        <p className="hint">Выберите нужное действие</p>
        <button type="button" className="primary-btn" onClick={() => navigateTo('/login')}>
          Логин
        </button>
        <button type="button" className="secondary-btn" onClick={() => navigateTo('/register')}>
          Регистрация
        </button>
      </section>
    </main>
  )
}

function LoginPage() {
  return (
    <main className="page">
      <PageCard title="СТО" subtitle="Вход">
        <form action={`${API_BASE}/register/login`} method="post" className="form">
          <label htmlFor="login-username">Юзернейм</label>
          <input id="login-username" type="text" name="username" required />

          <label htmlFor="login-password">Пароль</label>
          <input id="login-password" type="password" name="password" required />

          <button type="submit" className="primary-btn">Войти</button>
        </form>
      </PageCard>
    </main>
  )
}

function RegisterPage() {
  const [role, setRole] = useState('owner')
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false)
  const [ownerUserId, setOwnerUserId] = useState(null)
  const [ownerFullName, setOwnerFullName] = useState('')
  const [registerError, setRegisterError] = useState('')

  const handleOpenQuestionnaire = async (event) => {
    event.preventDefault()
    setRegisterError('')

    if (role !== 'owner') {
      setRegisterError('Анкета механика пока не реализована.')
      return
    }

    const form = event.currentTarget.form
    const formData = new FormData(form)

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setRegisterError(data.detail || 'Ошибка базовой регистрации.')
        return
      }

      setOwnerUserId(data.id)
      setIsOwnerModalOpen(true)
    } catch {
      setRegisterError('Не удалось связаться с сервером.')
    }
  }

  const closeOwnerModal = () => {
    setIsOwnerModalOpen(false)
  }

  const handleOwnerSubmit = async (event) => {
    event.preventDefault()
    setRegisterError('')

    if (!ownerUserId) {
      setRegisterError('Не найден user_id. Повторите регистрацию.')
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.append('user_id', String(ownerUserId))
    formData.append('full_name', ownerFullName)

    try {
      const response = await fetch(`${API_BASE}/register/owners?user_id=${ownerUserId}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setRegisterError(data.detail || 'Ошибка сохранения анкеты владельца.')
        return
      }

      closeOwnerModal()
      navigateTo('/login')
    } catch {
      setRegisterError('Не удалось сохранить анкету владельца.')
    }
  }

  return (
    <main className="page">
      <PageCard title="СТО" subtitle="Регистрация">
        <form className="form">
          <label htmlFor="register-username">Юзернейм</label>
          <input id="register-username" type="text" name="username" required />

          <label htmlFor="register-password">Пароль</label>
          <input id="register-password" type="password" name="password" required />

          <label htmlFor="register-role">Роль</label>
          <select
            id="register-role"
            name="role"
            required
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="owner">Владелец</option>
            <option value="mechanic">Механик</option>
          </select>

          <button type="button" className="primary-btn" onClick={handleOpenQuestionnaire}>
            Далее
          </button>
          <p className="hint">После выбора роли откроется анкета</p>
          {registerError && <p className="error-text">{registerError}</p>}
        </form>
      </PageCard>

      {isOwnerModalOpen && (
        <div className="modal-overlay" onClick={closeOwnerModal}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Анкета владельца</h3>
            <form onSubmit={handleOwnerSubmit} className="form modal-form">
              <label htmlFor="owner-fullname">ФИО</label>
              <input
                id="owner-fullname"
                type="text"
                name="full_name"
                value={ownerFullName}
                onChange={(event) => setOwnerFullName(event.target.value)}
                required
              />

              <label htmlFor="owner-address">Адрес</label>
              <input id="owner-address" type="text" name="address" required />

              <label htmlFor="owner-age">Возраст</label>
              <input id="owner-age" type="number" name="age" min="18" max="99" required />

              <label htmlFor="owner-passport">Номер и серия паспорта</label>
              <input id="owner-passport" type="text" name="passport_number" placeholder="1234 567890" required />

              <label htmlFor="owner-phone">Контактный телефон</label>
              <input id="owner-phone" type="tel" name="phone" placeholder="+7XXXXXXXXXX" required />

              <button type="submit" className="primary-btn">Зарегистрироваться</button>
              <button type="button" className="modal-cancel-btn" onClick={closeOwnerModal}>Отмена</button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleRouteChange = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  if (path === '/login') {
    return <LoginPage />
  }

  if (path === '/register') {
    return <RegisterPage />
  }

  return <HomePage />
}

export default App
