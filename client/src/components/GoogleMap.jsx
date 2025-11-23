import { useEffect, useRef } from 'react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const API_URL = import.meta.env.VITE_API_URL || ''

function GoogleMap({ location, legalClinics = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    let isCancelled = false

    const tryGetUserPosition = async () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        )
      })
    }

    const initializeMap = () => {
      if (!window.google || !mapRef.current) return

      // Determine center: prefer numeric `location` prop; otherwise user position; otherwise default
      let center = { lat: 43.6532, lng: -79.3832 }
      const coordsFromProp = location ? location.split(',').map(s => s.trim()) : null

      if (coordsFromProp && coordsFromProp.length === 2 && !isNaN(coordsFromProp[0]) && !isNaN(coordsFromProp[1])) {
        center = { lat: parseFloat(coordsFromProp[0]), lng: parseFloat(coordsFromProp[1]) }
      }

      const initAsync = async () => {
        let userPos = null
        if (!coordsFromProp) {
          userPos = await tryGetUserPosition()
          if (userPos) center = userPos
        }

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
        })
        mapInstanceRef.current = map

        // helper to create a pin SVG data URL icon
        const makePinIcon = (color = '#4285F4', size = 36) => {
          const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24'><path d='M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z' fill='${color}' stroke='%23ffffff' stroke-width='1.2'/></svg>`
          return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            scaledSize: new window.google.maps.Size(size, size),
            anchor: new window.google.maps.Point(size / 2, size),
          }
        }

        // Add user or center pin
        if (userPos) {
          new window.google.maps.Marker({ position: userPos, map, title: 'Your Location', icon: makePinIcon('#4285F4', 40) })
        } else {
          new window.google.maps.Marker({ position: center, map, title: 'Search Location', icon: makePinIcon('#34A853', 36) })
        }

        const baseSearchCenter = userPos || center
        map.setCenter(baseSearchCenter)

        // Try client-side PlacesService first; otherwise fall back to server-side /clinics
        let placesFound = []
        const hasClientPlaces = !!(window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlacesService)
        if (hasClientPlaces) {
          const service = new window.google.maps.places.PlacesService(map)
          const keywords = ['legal aid', 'tenant help', 'tenant', 'legal clinic']
          for (const kw of keywords) {
            // eslint-disable-next-line no-await-in-loop
            const res = await new Promise((resolve) => {
              service.nearbySearch({ location: baseSearchCenter, radius: 5000, keyword: kw }, (r, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && r) resolve(r)
                else resolve([])
              })
            })
            if (res && res.length) { placesFound = res; break }
          }
          if (!placesFound.length) {
            placesFound = await new Promise((resolve) => {
              service.nearbySearch({ location: baseSearchCenter, radius: 5000, keyword: 'clinic' }, (r, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && r) resolve(r)
                else resolve([])
              })
            })
          }
          // normalize
          placesFound = placesFound.map(p => ({ name: p.name, vicinity: p.vicinity || p.formatted_address || '', geometry: p.geometry, rating: p.rating }))
        } else {
          try {
            const resp = await fetch(`${API_URL}/clinics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat: baseSearchCenter.lat, lng: baseSearchCenter.lng }) })
            if (resp.ok) {
              const data = await resp.json()
              if (data?.ok && Array.isArray(data.clinics)) {
                placesFound = data.clinics.map(c => ({ name: c.displayName, vicinity: c.formattedAddress, geometry: { location: { lat: () => c.location.latitude, lng: () => c.location.longitude } }, rating: c.rating }))
              }
            } else {
              console.warn('Server /clinics returned', resp.status)
            }
          } catch (e) {
            console.warn('Failed to fetch /clinics', e)
          }
        }

        // Place markers and fit bounds
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(new window.google.maps.LatLng(baseSearchCenter.lat, baseSearchCenter.lng))

        placesFound.slice(0, 8).forEach((place, index) => {
          if (!place.geometry || !place.geometry.location) return
          const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat
          const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng
          const pos = { lat, lng }
          const marker = new window.google.maps.Marker({
            position: pos,
            map,
            title: place.name,
            icon: makePinIcon('#EA4335', 36),
          })

          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${place.name} ${pos.lat},${pos.lng}`
          )}`

          const infowindow = new window.google.maps.InfoWindow({ content: `
                <div style="padding:8px; max-width:240px; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
                  <div style="font-size:15px; margin-bottom:6px;"><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#268de6; text-decoration:none; font-weight:600;">${place.name}</a></div>
                  <div style="color:#666; font-size:13px; margin-top:2px;">${place.vicinity || ''}</div>
                  ${place.rating ? `<div style="margin-top:6px; font-size:13px; color:#444;">⭐ ${place.rating}</div>` : ''}
                </div>
              ` })

          marker.addListener('click', () => infowindow.open(map, marker))
          bounds.extend(new window.google.maps.LatLng(pos.lat, pos.lng))
        })

        map.fitBounds(bounds)
        window.google.maps.event.addListenerOnce(map, 'idle', () => { if (map.getZoom() > 15) map.setZoom(15) })
      }

      // call async initializer
      initAsync()

      return
    }

    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        return Promise.resolve()
      }

      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Missing VITE_GOOGLE_MAPS_API_KEY in client/.env')
        return Promise.reject(new Error('Missing Google Maps API key'))
      }

      if (!window._googleMapsLoadPromise) {
        window._googleMapsLoadPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`
          script.async = true
          script.defer = true
          script.onload = () => resolve()
          script.onerror = (err) => reject(err)
          document.head.appendChild(script)
        })
      }

      return window._googleMapsLoadPromise
    }

    loadGoogleMapsScript()
      .then(() => {
        if (!isCancelled) {
          initializeMap()
        }
      })
      .catch((err) => {
        console.error('Failed to load Google Maps', err)
      })

    return () => {
      isCancelled = true
    }

  }, [location, legalClinics])

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }} 
    />
  )
}

export default GoogleMap
