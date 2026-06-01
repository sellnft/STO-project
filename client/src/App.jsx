import './App.css'
import { useEffect, useState } from 'react'
import LoginForm from './components/LoginForm'
import OwnerQuestionnaireModal from './components/OwnerQuestionnaireModal'
import EmployeeQuestionnaireModal from './components/EmployeeQuestionnaireModal'
import OwnerDashboard from './components/OwnerDashboard'
import MechanicDashboard from './components/MechanicDashboard'
import AdminDashboard from './components/AdminDashBoard'

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
        <LoginForm action={`${API_BASE}/register/login`} />
      </PageCard>
    </main>
  )
}

function RegisterPage() {
  const [role, setRole] = useState('owner')
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false)
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
  const [registeredUserId, setRegisteredUserId] = useState(null)

  const [ownerFullName, setOwnerFullName] = useState('')

  const [employeeFullName, setEmployeeFullName] = useState('')
  const [employeeSpecialization, setEmployeeSpecialization] = useState('')
  const [employeeRank, setEmployeeRank] = useState('')

  const [registerError, setRegisterError] = useState('')

  const handleOpenQuestionnaire = async (event) => {
    event.preventDefault()
    setRegisterError('')

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

      setRegisteredUserId(data.id)

      if (role === 'owner') {
        setIsOwnerModalOpen(true)
        return
      }

      if (role === 'mechanic') {
        setIsEmployeeModalOpen(true)
      }
    } catch {
      setRegisterError('Не удалось связаться с сервером.')
    }
  }

  const handleOwnerSubmit = async (event) => {
    event.preventDefault()
    setRegisterError('')

    if (!registeredUserId) {
      setRegisterError('Не найден user_id. Повторите регистрацию.')
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.append('user_id', String(registeredUserId))
    formData.append('full_name', ownerFullName)

    try {
      const response = await fetch(`${API_BASE}/register/owners?user_id=${registeredUserId}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setRegisterError(data.detail || 'Ошибка сохранения анкеты владельца.')
        return
      }

      setIsOwnerModalOpen(false)
      navigateTo('/login')
    } catch {
      setRegisterError('Не удалось сохранить анкету владельца.')
    }
  }

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault()
    setRegisterError('')

    if (!registeredUserId) {
      setRegisterError('Не найден user_id. Повторите регистрацию.')
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.append('user_id', String(registeredUserId))
    formData.append('full_name', employeeFullName)
    formData.append('specialization', employeeSpecialization)
    formData.append('rank', employeeRank)

    try {
      const response = await fetch(`${API_BASE}/register/employees?user_id=${registeredUserId}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setRegisterError(data.detail || 'Ошибка сохранения анкеты механика.')
        return
      }

      setIsEmployeeModalOpen(false)
      navigateTo('/login')
    } catch {
      setRegisterError('Не удалось сохранить анкету механика.')
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

      <OwnerQuestionnaireModal
        isOpen={isOwnerModalOpen}
        fullName={ownerFullName}
        onFullNameChange={setOwnerFullName}
        onSubmit={handleOwnerSubmit}
        onClose={() => setIsOwnerModalOpen(false)}
      />

      <EmployeeQuestionnaireModal
        isOpen={isEmployeeModalOpen}
        fullName={employeeFullName}
        specialization={employeeSpecialization}
        rank={employeeRank}
        onFullNameChange={setEmployeeFullName}
        onSpecializationChange={setEmployeeSpecialization}
        onRankChange={setEmployeeRank}
        onSubmit={handleEmployeeSubmit}
        onClose={() => setIsEmployeeModalOpen(false)}
      />
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

  if (path === '/owner') {
    return <OwnerDashboard />
  }

  if (path === '/mechanic') {
    return <MechanicDashboard />;
  }

  if (path === '/admin') {
    return <AdminDashboard />
  }

  return <HomePage />
}

export default App