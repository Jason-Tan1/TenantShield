import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function Landing() {
  const navigate = useNavigate()
  const goToSignup = useCallback(() => navigate('/signup'), [navigate])

  return (
    <main className="main-content">
      <div className="hero-section">
        <p className="hero-badge">TenantShield</p>
        <h1 className="hero-title">Your AI-Powered<br/>Housing Rights Advocate</h1>
        <p className="hero-description">Instantly scan for unsafe conditions, understand your tenant rights, and find legal support—all in one place.</p>
        <div style={{ marginTop: '1.25rem' }}>
          <button className="primary-button" onClick={goToSignup}>Get Started for Free</button>
        </div>
      </div>

      <div style={{ height: '28px' }} />

      <div className="grid-2">
        <div className="feature-card">
          <div className="feature-icon">📷</div>
          <h3>Detect Unsafe Conditions</h3>
          <p>Use your phone's camera to scan for mold, pests, leaks, and other issues. Our AI provides an instant, easy-to-understand report.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚖️</div>
          <h3>Understand Your Rights</h3>
          <p>Get clear, concise summaries of local laws and practical next steps tailored to your address.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Find Legal Support</h3>
          <p>Locate nearby legal aid clinics on an interactive map with contact details and directions.</p>
        </div>
      </div>
    </main>
  )
}
