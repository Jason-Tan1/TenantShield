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
      <main className="main-content">
      <div className="hero-section">
        <h1 className="hero-title">
          Welcome, {currentUser.fullName}!
        </h1>
        <p className="hero-description">
          Take a photo of mold, pests, leaks, or damage. Our AI will scan it, cite local laws,
          and draft a legal notice for you.
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
            {imagePreviews.length > 0 ? (
              <div className="images-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button 
                      className="remove-image"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(index)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="add-more-box">
                  <div className="add-more-icon">+</div>
                  <p className="add-more-text">Add More</p>
                </div>
              </div>
            ) : (
              <>
                <div className="camera-icon">📷</div>
                <p className="upload-text">Take Photos or Upload</p>
                <p className="upload-subtext">Supports JPG, PNG (Multiple files)</p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
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
          <button
            className="detect-button"
            onClick={detectLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? 'Detecting…' : 'Detect My Location'}
          </button>
          {locationStatus && (
            <p
              className="location-hint"
              style={{
                color: locationStatus.includes('Unable') ? '#B42318' : '#0F8B8D',
                marginTop: '8px'
              }}
            >
              {locationStatus}
            </p>
          )}
        </div>

        {/* Scan Button */}
        <button 
          className={`scan-button ${canRunScan ? 'active' : 'disabled'}`}
          onClick={handleRunScan}
          disabled={!canRunScan || isScanning}
        >
          {isScanning ? 'Scanning with Gemini...' : 'Run Legal Scan →'}
        </button>
        {images.length === 0 ? (
          <p className="upload-reminder">⚠️ Upload at least one photo to start</p>
        ) : (
          <p className="upload-reminder">✓ {images.length} image{images.length > 1 ? 's' : ''} uploaded</p>
        )}
        {(analysis || errorMessage) && (
          <div className="analysis-container">
            <div className="analysis-header">
              <div className="analysis-icon">🤖</div>
              <div>
                <p className="analysis-title">Gemini Findings</p>
                <p className="analysis-subtitle">Based on your photos and notes.</p>
              </div>
              <span className={`status-chip ${errorMessage ? 'error' : 'success'}`}>
                {errorMessage ? 'Failed' : 'Ready'}
              </span>
            </div>
            {errorMessage ? (
              <div className="analysis-error">{errorMessage}</div>
            ) : (
              <p className="analysis-text">{analysis}</p>
            )}
          </div>
        )}
      </div>
      </main>
      <Footer />
    </>
  )
}

export default Home
