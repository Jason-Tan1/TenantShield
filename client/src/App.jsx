import { useState } from 'react'
import './App.css'

function App() {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [details, setDetails] = useState('')
  const [location, setLocation] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`)
        },
        (error) => {
          alert('Unable to retrieve location. Please enter manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  const handleRunScan = async () => {
    if (!image) {
      alert('Please upload a photo first')
      return
    }

    setIsScanning(true)

    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false)
      alert('Legal scan complete! Your violation has been documented.')
    }, 2000)
  }

  const canRunScan = image && details.trim() !== '' && location.trim() !== ''

  return (
    <div className="app">
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

      <main className="main-content">
        <div className="hero-section">
          <h2>Identify violations.</h2>
          <h2>Know your rights.</h2>
          <p className="subtitle">
            Take a photo of mold, pests, leaks, or damage. Our AI will scan it,
            identify legal violations, and tell you exactly what to do.
          </p>
        </div>

        <div className="form-container">
          {/* Evidence Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="step-icon">📷</span>
              <h3>1. Evidence</h3>
            </div>
            <div 
              className="upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input').click()}
            >
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              ) : (
                <>
                  <div className="camera-icon">📷</div>
                  <p className="upload-text">Take Photo or Upload</p>
                  <p className="upload-subtext">Supports JPG, PNG</p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="step-icon">📝</span>
              <h3>2. Details</h3>
            </div>
            <textarea
              className="details-input"
              placeholder="Describe the issue... (e.g. This mold has been growing for 2 weeks and the landlord ignores my texts.)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          {/* Location Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="step-icon">📍</span>
              <h3>3. Location</h3>
            </div>
            <p className="location-hint">
              Required to find specific local laws and legal clinics near you.
            </p>
            <input
              type="text"
              className="location-input"
              placeholder="Enter location or detect automatically"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="detect-button" onClick={detectLocation}>
              Detect My Location
            </button>
          </div>

          {/* Scan Button */}
          <button 
            className={`scan-button ${canRunScan ? 'active' : 'disabled'}`}
            onClick={handleRunScan}
            disabled={!canRunScan || isScanning}
          >
            {isScanning ? 'Scanning...' : 'Run Legal Scan →'}
          </button>
          {!image && (
            <p className="upload-reminder">⚠️ Upload a photo to start</p>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
