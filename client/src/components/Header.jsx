import { Link } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo-link" aria-label="TenantShield home">
        <div className="logo-container">
          <div className="logo-icon" aria-hidden="true">
            <img src="/home-logo.svg" alt="TenantShield logo" className="logo-icon-img" />
          </div>
          <div className="logo-text">
            <h1>TenantShield</h1>
            <p>Know Your Rights, AI Will Help</p>
          </div>
        </div>
      </Link>
    </header>
  )
}

export default Header
