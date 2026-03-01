'use client'

import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map, Marker, LeafletMouseEvent } from 'leaflet'

interface SmartLocationPickerProps {
  defaultLat?: number;
  defaultLng?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  isReadOnly?: boolean; // NEW: Locks the map if they are using the Link method
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; street?: string; city?: string; state?: string; };
}

export default function SmartLocationPicker({ 
  defaultLat = 21.1702, 
  defaultLng = 72.8311, 
  onLocationChange,
  isReadOnly = false 
}: SmartLocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  
  const onLocationChangeRef = useRef(onLocationChange)
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  // 1. INITIALIZE MAP
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || mapRef.current) return

      const map = L.map(mapContainerRef.current!, {
        minZoom: 5,
        dragging: !isReadOnly, // Disable map panning if read-only
        scrollWheelZoom: !isReadOnly
      }).setView([defaultLat, defaultLng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map)

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41],
      })

      const marker = L.marker([defaultLat, defaultLng], { 
        icon, 
        draggable: !isReadOnly // Disable pin dragging if read-only
      }).addTo(map)

      if (!isReadOnly) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          if (onLocationChangeRef.current) onLocationChangeRef.current(pos.lat, pos.lng)
        })

        map.on('click', (e: LeafletMouseEvent) => {
          marker.setLatLng(e.latlng)
          map.flyTo(e.latlng)
          if (onLocationChangeRef.current) onLocationChangeRef.current(e.latlng.lat, e.latlng.lng)
        })
      }

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadOnly]) 

  // 2. LISTEN FOR EXTERNAL COORDINATE CHANGES
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - defaultLat) > 0.0001 || Math.abs(currentPos.lng - defaultLng) > 0.0001) {
        mapRef.current.flyTo([defaultLat, defaultLng], 15, { animate: true });
        markerRef.current.setLatLng([defaultLat, defaultLng]);
      }
    }
  }, [defaultLat, defaultLng]);

  async function handleSearch(text: string) {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    setQuery(addressName)
    setResults([])
    if (onLocationChangeRef.current) onLocationChangeRef.current(lat, lng)

    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.5 })
      markerRef.current.setLatLng([lat, lng])
    }
  }

  return (
    <div className="space-y-0 relative z-0">
      {!isReadOnly && (
        <div className="relative z-[1000] mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for street, area, or landmark..."
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition shadow-sm"
          />
          
          {results.length > 0 && (
            <ul className="absolute bg-white border border-gray-400 w-full shadow-lg mt-1 max-h-60 overflow-y-auto rounded-xl">
              {results.map((r: PhotonFeature, i: number) => (
                <li 
                  key={i}
                  onClick={() => {
                    const [lng, lat] = r.geometry.coordinates
                    const addressName = r.properties.name || r.properties.street || "Selected Location"
                    selectAddress(lat, lng, addressName)
                  }}
                  className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0"
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
      )}

      <div 
        ref={mapContainerRef} 
        className={`h-[300px] w-full border border-neutral-300 rounded-xl overflow-hidden z-0 bg-gray-100 flex items-center justify-center text-sm text-gray-500 ${isReadOnly ? 'opacity-80 grayscale-[20%]' : ''}`}
      >
        Loading map engine...
      </div>
      
      {!isReadOnly && (
        <p className="text-xs text-neutral-500 mt-2 text-right">
          Drag the pin or click on the map to fine-tune your location.
        </p>
      )}
    </div>
  )
}