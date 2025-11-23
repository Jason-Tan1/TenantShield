function Header() {
  return (
    <header className="header">
      <div className="logo-container">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#3B82F6"/>
          </svg>
        </div>
        <div className="logo-text">
          <h1>TenantShield</h1>
          <p>Know Your Rights, AI Will Help</p>
        </div>
      </div>
    </header>
  )
}

export default Header
