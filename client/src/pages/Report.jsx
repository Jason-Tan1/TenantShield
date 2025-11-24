import { useMemo, useRef, useState } from 'react'
import GoogleMap from '../components/GoogleMap'
import Footer from '../components/Footer'

function Report({ report, onBack, onRescan }) {
  const {
    summary = '',
    rightsSummary = '',
    applicableLaws = [],
    actions = [],
    landlordMessage = '',
    documentation = '',
    evidenceChecklist = [],
    clinicLinks = [],
    location = '',
  } = report || {}

  const [activeSection, setActiveSection] = useState('summary')
  const summaryRef = useRef(null)
  const rightsRef = useRef(null)
  const draftRef = useRef(null)
  const clinicsRef = useRef(null)

  const normalizeList = (items) => {
    if (!items) return []
    if (Array.isArray(items)) return items
    return [items]
  }

  const renderList = (items) => {
    const list = normalizeList(items)
    return list && list.length > 0 ? (
      <ul className="report-list">
        {list.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="muted">No items provided.</p>
    )
  }

  const navItems = useMemo(() => ([
    { id: 'summary', label: 'Summary', icon: '📊', description: 'Overview of the situation' },
    { id: 'rights', label: 'Rights & Laws', icon: '⚖️', description: 'Know your protections' },
    { id: 'draft', label: 'Evidence & Draft', icon: '📝', description: 'Letter & checklist' },
    { id: 'clinics', label: 'Nearby Clinics', icon: '📍', description: 'Local legal aid' },
  ]), [])

  const handleNavClick = (id) => {
    setActiveSection(id)
    const refMap = {
      summary: summaryRef,
      rights: rightsRef,
      draft: draftRef,
      clinics: clinicsRef
    }
    const el = refMap[id]?.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const copyDraft = () => {
    const text = landlordMessage || 'No draft provided.'
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const identifiedIssue = summary || 'Issue summary not available.'
  const urgency = 'High Priority'

  return (
    <>
      <div className="report-page">
        <nav className="report-topbar">
          <div className="report-brand">
            <div className="report-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span>TenantShield</span>
          </div>
          <div className="report-top-actions">
            <button className="btn btn-ghost" onClick={onBack}>← Back</button>
            <button className="btn btn-primary" onClick={onRescan}>New Scan</button>
          </div>
        </nav>

        <div className="report-shell">
          <aside className="report-side">
            <div className="report-side-menu">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`report-side-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                >
                  <span className="report-side-icon" aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="report-main">
            <header className="report-header">
              <h1>Analysis Complete</h1>
              <p>Based on your uploaded photos and notes.</p>
            </header>

            <section id="summary" ref={summaryRef} className="report-card">
              <div className="report-card-top">
                <h2>Situation Summary</h2>
                <span className="tag ready">Analysis Ready</span>
              </div>
              <div className="priority-pill">{urgency}</div>
              <div className="summary-stat-row">
                <div className="stat-pill">
                  <p className="stat-label">Identified Issue</p>
                  <p className="stat-value">{identifiedIssue}</p>
                </div>
              </div>
            </section>

            <section id="rights" ref={rightsRef} className="report-card">
              <div className="report-card-top">
                <h2>Your Legal Rights</h2>
                <span className="tag blue">Local Law</span>
              </div>
              <div className="law-block">
                <div className="law-header">Rights Summary</div>
                <p className="law-text">{rightsSummary || 'No rights information returned.'}</p>
              </div>
              <div className="law-block">
                <div className="law-header">Applicable Laws</div>
                {renderList(applicableLaws)}
              </div>
              <div className="law-block">
                <div className="law-header">Recommended Actions</div>
                {renderList(actions)}
              </div>
            </section>

            <section id="draft" ref={draftRef} className="report-card draft-card">
              <div className="report-card-top">
                <h2>Generated Notice Letter</h2>
              </div>
              <p className="draft-lede">This document adheres to formal notice requirements. Send via Certified Mail.</p>
              <div className="paper-doc">
                <button className="copy-btn" type="button" onClick={copyDraft}>Copy Text</button>
                <div className="paper-body">
                  <p>{landlordMessage || 'No draft provided.'}</p>
                </div>
              </div>
              <div className="law-block" style={{ marginTop: '20px' }}>
                <div className="law-header">Evidence Checklist</div>
                {renderList(evidenceChecklist)}
              </div>
              <div className="law-block">
                <div className="law-header">Documentation Tips</div>
                <p className="law-text">{documentation || 'No documentation guidance provided.'}</p>
              </div>
            </section>

            <section id="clinics" ref={clinicsRef} className="report-card">
              <div className="report-card-top">
                <h2>Legal Aid & Clinics</h2>
              </div>
              <div className="map-wrapper report-map">
                <GoogleMap location={location} legalClinics={clinicLinks} />
              </div>
              <div className="clinic-list">
                {clinicLinks && clinicLinks.length ? (
                  clinicLinks.map((clinic, idx) => (
                    <div key={idx} className="clinic-row">
                      <strong>{clinic.name || `Legal clinic ${idx + 1}`}</strong>
                      <span className="clinic-meta">{clinic.link || clinic.address || 'View in Maps'}</span>
                    </div>
                  ))
                ) : (
                  <p className="law-text">No clinics found. Try searching Google Maps for “legal aid clinic”.</p>
                )}
              </div>
            </section>
          </main>
        </div>
        <Footer />
      </div>
    </>
  )
}

export default Report
