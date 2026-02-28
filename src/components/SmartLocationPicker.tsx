'use client'

import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
// Import only the types from leaflet to avoid breaking SSR
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'

// 1. Define types for the Component Props
interface SmartLocationPickerProps {
  defaultLat?: number;
  defaultLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

// 2. Define types for the Komoot Photon API response structure
interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
  };
}

export default function SmartLocationPicker({ 
  defaultLat = 21.1702, 
  defaultLng = 72.8311, 
  onLocationChange 
}: SmartLocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  
  // 3. Apply Leaflet types to the Refs
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    import('leaflet').then((L) => {
      if (mapRef.current) return

      // Define the geographical boundaries of India [SouthWest, NorthEast]
      const indiaBounds = L.latLngBounds(
        L.latLng(8.0, 68.1),
        L.latLng(37.6, 97.4)
      )

      // Lock the map to those bounds
      // We use the non-null assertion operator (!) since we checked for it at the top of the effect
      const map = L.map(mapContainerRef.current!, {
        maxBounds: indiaBounds,
        maxBoundsViscosity: 1.0, 
        minZoom: 5 
      }).setView([defaultLat, defaultLng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41],
      })

      const marker = L.marker([defaultLat, defaultLng], { icon, draggable: true }).addTo(map)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })

      // 4. Strongly type the Leaflet mouse event
      map.on('click', (e: LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        onLocationChange(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [defaultLat, defaultLng, onLocationChange])

  async function handleSearch(text: string) {
    setQuery(text)
    if (text.length < 3) return setResults([])
    
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&bbox=68.1,8.0,97.4,37.6`)
      const data = await res.json()
      setResults(data.features || [])
    } catch (err) {
      console.error("Search failed", err)
    }
  }

  function selectAddress(lat: number, lng: number, addressName: string) {
    setQuery(addressName)
    setResults([])
    onLocationChange(lat, lng)

    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.5 })
      markerRef.current.setLatLng([lat, lng])
    }
  }

  return (
    <div className="space-y-0 relative z-0">
      <div className="relative z-[1000] mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for street, area, or landmark in India..."
          className="border border-gray-400 p-3 w-full text-sm font-semibold shadow-sm focus:outline-none focus:border-black"
        />
        
        {results.length > 0 && (
          <ul className="absolute bg-white border border-gray-400 w-full shadow-lg mt-1 max-h-60 overflow-y-auto">
            {/* 5. Results mapped against the newly created PhotonFeature interface */}
            {results.map((r: PhotonFeature, i: number) => (
              <li 
                key={i}
                onClick={() => {
                  const [lng, lat] = r.geometry.coordinates
                  const addressName = r.properties.name || r.properties.street || "Selected Location"
                  selectAddress(lat, lng, addressName)
                }}
                className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-200 last:border-0"
              >
                <div className="font-bold text-gray-800">{r.properties.name}</div>
                <div className="text-xs text-gray-500">
                  {[r.properties.street, r.properties.city, r.properties.state].filter(Boolean).join(', ')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div 
        ref={mapContainerRef} 
        className="h-[350px] w-full border border-gray-400 z-0 bg-gray-100 flex items-center justify-center text-sm text-gray-500"
      >
        Loading map engine...
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-right">
        Drag the pin or click on the map to fine-tune your entrance location.
      </p>
    </div>
  )
}