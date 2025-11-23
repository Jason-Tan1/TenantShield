import { useState } from 'react'

function Home() {
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [details, setDetails] = useState('')
  const [location, setLocation] = useState('')
  const [isScanning, setIsScanning] = useState(false)

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
    if (images.length === 0) {
      alert('Please upload at least one photo')
      return
    }

    setIsScanning(true)

    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false)
      alert(`Legal scan complete! Analyzed ${images.length} image(s). Your violations have been documented.`)
    }, 2000)
  }

  const canRunScan = images.length > 0 && details.trim() !== '' && location.trim() !== ''

  return (
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
        {images.length === 0 ? (
          <p className="upload-reminder">⚠️ Upload at least one photo to start</p>
        ) : (
          <p className="upload-reminder">✓ {images.length} image{images.length > 1 ? 's' : ''} uploaded</p>
        )}
      </div>
    </main>
  )
}

export default Home
