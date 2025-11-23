import { useState, useEffect } from 'react'
import Report from './Report'
import Footer from '../components/Footer'

function Home({ currentUser }) {
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [details, setDetails] = useState('')
  const [location, setLocation] = useState('')
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [reportData, setReportData] = useState(null)
  const [view, setView] = useState('form')

  useEffect(() => {
    if (currentUser && currentUser.address) {
      setLocation(currentUser.address)
      setLocationStatus(`Using address: ${currentUser.address}`)
    }
  }, [currentUser])

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const newImages = [...images, ...files]
      setImages(newImages)
      
      // Read all files and create previews
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    
    if (files.length > 0) {
      const newImages = [...images, ...files]
      setImages(newImages)
      
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const buildPayloadImages = () => {
    return imagePreviews
      .map((preview) => {
        const [meta, data] = preview.split(',')
        if (!data) return null
        const mimeMatch = meta.match(/data:(.*);base64/)
        return {
          data,
          mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg'
        }
      })
      .filter(Boolean)
  }

  const fetchNetworkLocation = async () => {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) {
      throw new Error('Network lookup failed')
    }
    const data = await response.json()
    if (!data.latitude || !data.longitude) {
      throw new Error('Location data incomplete')
    }

    const lat = Number(data.latitude).toFixed(6)
    const lng = Number(data.longitude).toFixed(6)
    setLocation(`${lat}, ${lng}`)
    const cityRegion = [data.city, data.region || data.country_name]
      .filter(Boolean)
      .join(', ')
    setLocationStatus(
      cityRegion
        ? `Approximate location detected via network: ${cityRegion}`
        : 'Approximate location detected via network provider.'
    )
  }

  const detectLocation = async () => {
    setLocationStatus('')

    const tryNetworkFallback = async () => {
      try {
        await fetchNetworkLocation()
      } catch (fallbackError) {
        console.error('Network fallback failed:', fallbackError)
        setLocationStatus('Unable to detect automatically. Please enter your location manually.')
      }
    }

    setIsDetectingLocation(true)

    if (!navigator.geolocation) {
      setLocationStatus('Browser GPS not available. Trying network-based lookup…')
      await tryNetworkFallback()
      setIsDetectingLocation(false)
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })
      const lat = position.coords.latitude.toFixed(6)
      const lng = position.coords.longitude.toFixed(6)
      setLocation(`${lat}, ${lng}`)
      setLocationStatus('Detected using device GPS.')
    } catch (error) {
      console.error('Device geolocation failed:', error)
      setLocationStatus('Device GPS failed. Trying network-based lookup…')
      await tryNetworkFallback()
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const handleRunScan = async () => {
    if (images.length === 0) {
      alert('Please upload at least one photo')
      return
    }

    const payloadImages = buildPayloadImages()
    if (payloadImages.length === 0) {
      alert('We could not read your images. Please re-upload and try again.')
      return
    }

    setIsScanning(true)
    setErrorMessage('')
    setAnalysis('')
    setReportData(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: payloadImages,
          details,
          location
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const detailText = result.details ? `: ${result.details}` : ''
        throw new Error(result.error ? `${result.error}${detailText}` : 'Gemini could not analyze the image')
      }

      const fallbackReport = {
        summary: result.summary || 'Gemini returned an empty response.',
        rightsSummary: '',
        applicableLaws: [],
        actions: [],
        landlordMessage: '',
        documentation: '',
        evidenceChecklist: [],
        clinicLinks: [],
      }

      setReportData(result.report || fallbackReport)
      setAnalysis(result.summary || 'Gemini returned an empty response.')
      setView('report')
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong while scanning.')
    } finally {
      setIsScanning(false)
    }
  }

  const canRunScan = images.length > 0 && details.trim() !== '' && location.trim() !== ''
  const quickFill = (text) => {
    setDetails(prev => prev ? `${prev} ${text}` : text)
  }
  const greetingName = currentUser?.fullName || 'there'

  if (view === 'report' && reportData) {
    return (
      <Report
        report={reportData}
        onBack={() => setView('form')}
        onRescan={() => {
          setErrorMessage('')
          setIsScanning(false)
          setAnalysis('')
          setView('form')
        }}
      />
    )
  }

  return (
    <>
      <div className="home-page">
        <header className="home-header">
          <h1>Welcome, <span>{greetingName}!</span></h1>
          <p className="home-subtitle">Take a photo of mold, pests, leaks, or damage. Our AI will scan it, cite local laws, and draft a legal notice for you.</p>
        </header>

        <main className="home-card">
          {/* STEP 1: Evidence */}
          <section className="home-section">
            <div className="home-section-header">
              <div className="home-step-badge">1</div>
              <h2 className="home-section-title">Evidence</h2>
            </div>

            <div
              className="home-upload-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="home-upload-icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <div className="home-upload-text">
                <strong>Take Photos or Upload</strong>
                <span>Supports JPG, PNG (Multiple files)</span>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="home-images-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="home-image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      className="home-remove-image"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </section>

          {/* STEP 2: Details */}
          <section className="home-section">
            <div className="home-section-header">
              <div className="home-step-badge">2</div>
              <h2 className="home-section-title">Details</h2>
            </div>

            <textarea
              className="home-textarea"
              placeholder="Describe the issue... (e.g. This mold has been growing for 2 weeks and the landlord ignores my texts.)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <div className="home-helper-chips">
              <button type="button" className="home-chip" onClick={() => quickFill('Mold in bathroom ceiling for 2 weeks, getting worse.')}>Mold</button>
              <button type="button" className="home-chip" onClick={() => quickFill('Water leak from ceiling, landlord notified but not fixed.')}>Water Leak</button>
              <button type="button" className="home-chip" onClick={() => quickFill('Pest infestation in kitchen despite repeated complaints.')}>Pest Infestation</button>
            </div>
          </section>

          {/* STEP 3: Location */}
          <section className="home-section">
            <div className="home-section-header">
              <div className="home-step-badge">3</div>
              <h2 className="home-section-title">Location</h2>
            </div>
            <p className="home-helper-text">Required to find specific local laws and legal clinics.</p>

            <div className="home-location-group">
              <div className="home-input-wrapper">
                <svg className="home-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <input
                  type="text"
                  value={location}
                  placeholder="Enter address"
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <button
                className="home-detect-btn"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                type="button"
              >
                {isDetectingLocation ? 'Detecting…' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                    </svg>
                    Detect
                  </>
                )}
              </button>
            </div>

            {locationStatus && (
              <div className="home-success-message">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {locationStatus}
              </div>
            )}
          </section>

          {/* ACTION */}
          <section className="home-submit-area">
            <button
              className="home-btn-primary"
              onClick={handleRunScan}
              disabled={!canRunScan || isScanning}
            >
              {isScanning ? 'Scanning…' : 'Run Legal Scan'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            {!canRunScan && (
              <span className="home-warning-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Upload at least one photo and describe the issue to start
              </span>
            )}
            {errorMessage && <p className="analysis-error">{errorMessage}</p>}
            {analysis && (
              <div className="analysis-container">
                <div className="analysis-header">
                  <div className="analysis-icon">🔎</div>
                  <div>
                    <p className="analysis-title">AI Analysis</p>
                    <p className="analysis-subtitle">Summary of the issue and applicable laws</p>
                  </div>
                  <span className="status-chip success">Ready</span>
                </div>
                <div className="analysis-text">{analysis}</div>
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </>
  )
}

export default Home
