import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

export default function Landing() {
  const navigate = useNavigate()
  const goToSignup = useCallback(() => navigate('/signup'), [navigate])

  return (
    <div className="landing-page">
      <header className="landing-hero centered">
        <span className="landing-badge">TenantShield</span>
        <h1 className="landing-title">Your AI-Powered<br/>Housing Rights Advocate</h1>
        <p className="landing-subtitle">
          Instantly scan for unsafe conditions, understand your tenant rights, and find legal support
          <br/>—all in one place.
        </p>
        <button className="landing-cta" onClick={goToSignup}>Get Started for Free</button>
      </header>

      <section className="landing-features">
        <div className="landing-feature-card">
          <div className="landing-feature-icon">📷</div>
          <h3>Detect Unsafe Conditions</h3>
          <p>Use your phone&apos;s camera to scan for hazards like mold, pests, leaks, and wiring issues. Get instant AI insights.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">⚖️</div>
          <h3>Understand Your Rights</h3>
          <p>Clear, concise summaries of local housing laws. We translate complex legal jargon into plain language.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">📍</div>
          <h3>Find Legal Support</h3>
          <p>Locate nearby legal aid clinics and tenant unions on an interactive map with contact info and directions.</p>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon">💬</div>
          <h3>Get Personalized Help</h3>
          <p>Share details to receive tailored guidance, letter templates, and local resources for your next steps.</p>
        </div>
      </section>
    </div>
  )
}
