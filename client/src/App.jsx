import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Landing from './pages/Landing'
import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

function App() {
  const [signedUp, setSignedUp] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

  const handleSignup = ({ fullName, address }) => {
    setCurrentUser({ fullName, address })
    setSignedUp(true)
    navigate('/app')
  }

  const location = useLocation()

  const showHeader = location.pathname !== '/signup' && location.pathname !== '/'

  return (
    <div className="app">
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
        <Route path="/app" element={signedUp ? <Home currentUser={currentUser} /> : <Navigate to="/signup" replace />} />
      </Routes>
    </div>
  )
}

export default App
