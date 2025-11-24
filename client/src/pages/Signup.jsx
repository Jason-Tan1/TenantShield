import { useEffect, useRef, useState } from 'react';
import './Signup.css';

function Signup({ onSignup }) {
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const autocompleteServiceRef = useRef(null);
  const debounceRef = useRef(null);
  const googleMapsLoadingRef = useRef(null);

  // Lazy-load the Google Places script so we can fetch address suggestions.
  const loadGoogleMapsScript = () => {
    if (googleMapsLoadingRef.current) return googleMapsLoadingRef.current;
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      googleMapsLoadingRef.current = Promise.resolve();
      return googleMapsLoadingRef.current;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      googleMapsLoadingRef.current = Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
      return googleMapsLoadingRef.current;
    }

    googleMapsLoadingRef.current = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });

    return googleMapsLoadingRef.current;
  };

  useEffect(() => {
    let isCancelled = false;
    loadGoogleMapsScript()
      .then(() => {
        if (isCancelled) return;
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
      })
      .catch((err) => {
        console.warn('Google Maps script failed to load:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAddressChange = (value) => {
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const service = autocompleteServiceRef.current;
      if (!service || !value.trim()) {
        setSuggestions([]);
        setShowSuggestions(!!value.trim());
        return;
      }

      service.getPlacePredictions(
        { input: value, types: ['address'] },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
          }
          setSuggestions(predictions.map((p) => p.description));
          setShowSuggestions(true);
        }
      );
    }, 150);
  };

  const handlePickSuggestion = (value) => {
    setAddress(value);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSignup({ fullName, address });
    }, 600);
  };

  return (
    <div className="signup-root">
      <div className="signup-left">
        <div className="signup-logo-row">
          <div className="signup-logo-icon" aria-hidden="true">
            <img src="/home-logo.svg" alt="TenantShield logo" style={{ width: 48, height: 48 }} />
          </div>
          <span className="signup-logo-text">Tenant Shield</span>
        </div >
        <div className="signup-badge">SMART ADDRESS MATCH</div>
        <h1 className="signup-title">Protecting your<br />home starts here.</h1>
        <p className="signup-desc">
          We analyze local ordinances based on your specific address to find lease violations that generic tools miss.
        </p>
        <div className="signup-footer-row">
          <span>✓ Bank-level encryption</span>
          <span>•</span>
          <span>No credit card required</span>
        </div>
      </div >
      <div className="signup-right">
        <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
          <h2 className="signup-form-title">Let's get you started</h2>
          <p className="signup-form-desc">We just need a few details to customize your protection plan.</p>
          <div className="signup-form-group">
            <label htmlFor="fullName" className="signup-label">Full Name</label>
            <div className="signup-input-row">
              <span className="signup-input-icon">👤</span>
              <input
                id="fullName"
                className="signup-input"
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="signup-form-group">
            <label htmlFor="address" className="signup-label">Property Address</label>
            <div className="signup-input-row">
              <span className="signup-input-icon">📍</span>
              <input
                id="address"
                className="signup-input"
                type="text"
                placeholder="Start typing your address"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => handleAddressChange(address)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                autoComplete="street-address"
                required
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="signup-suggestions" role="listbox">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="signup-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSuggestion(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className={`signup-submit${loading ? ' loading' : ''}`}
            type="submit"
            disabled={loading || !fullName || !address}
          >
            {loading ? 'Locating...' : 'Locate Property →'}
          </button>
          <div className="signup-form-footer-row">
            <span className="signup-form-footer-left">✓ Secure Connection</span>
          </div>
        </form>
      </div>
    </div >
  );
}

export default Signup;
