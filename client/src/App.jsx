import './App.css'
import Header from './components/Header'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Landing from './pages/Landing'
import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

function App() {
  const [signedUp, setSignedUp] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleSignup = (userWithLocation) => {
    // userWithLocation: { fullName, address, location: { lat, lon, display_name } }
    setUser({ fullName: userWithLocation.fullName, address: userWithLocation.address })
    setSelectedLocation(userWithLocation.location || null)
    setSignedUp(true)
    navigate('/app')
  }

  const location = useLocation()

  return (
    <div className="app">
      {location.pathname !== '/signup' && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
        <Route path="/app" element={signedUp ? <Home user={user} initialLocation={selectedLocation} /> : <Navigate to="/signup" replace />} />
        <Route path="/home" element={signedUp ? <Home user={user} initialLocation={selectedLocation} /> : <Navigate to="/signup" replace />} />
      </Routes>
    </div>
  )
}

export default App
