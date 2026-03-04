'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface Shop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface ShopDisplayMapProps {
  userLat?: number;
  userLng?: number;
  shops: Shop[];
  selectedShopId: string | null;
  onShopSelect: (shopId: string) => void;
  isDark: boolean;
}

export default function ShopDisplayMap({ 
  userLat, 
  userLng, 
  shops, 
  selectedShopId, 
  onShopSelect,
  isDark
}: ShopDisplayMapProps) {
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const clusterGroupRef = useRef<any>(null)

  // ==========================================================
  // 1. INITIALIZE MAP & LOAD LEAFLET SAFELY (Fixes the crash)
  // ==========================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;

    const initMap = async () => {
      // 1. Dynamically load Leaflet and force it onto the window object
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      (window as any).L = L;
      
      // 2. NOW we can safely load the plugin
      await import('leaflet.markercluster');

      if (!isMounted || mapRef.current) return;

      const centerLat = userLat || (shops[0]?.latitude ?? 21.1702);
      const centerLng = userLng || (shops[0]?.longitude ?? 72.8311);

      const map = L.map(mapContainerRef.current!, {
        minZoom: 5,
        zoomControl: false 
      }).setView([centerLat, centerLng], 14);

      L.tileLayer(
        isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', 
        { attribution: '&copy; CARTO' }
      ).addTo(map);

      mapRef.current = map;
      setTimeout(() => { map.invalidateSize() }, 100);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    }
  }, [isDark]);

  // ==========================================================
  // 2. RENDER MARKERS & CLUSTERS
  // ==========================================================
  useEffect(() => {
    if (!mapRef.current) return;

    const renderMarkers = async () => {
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      (window as any).L = L;
      await import('leaflet.markercluster');

      // Clear old layers before drawing new ones
      if (clusterGroupRef.current) {
        mapRef.current.removeLayer(clusterGroupRef.current);
      }
      if (markersLayerRef.current) {
        mapRef.current.removeLayer(markersLayerRef.current);
      }

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // User Location Dot
      if (userLat && userLng) {
        const userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.8); animation: pulse 2s infinite;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 })
         .addTo(markersLayerRef.current)
         .bindTooltip("You Are Here", { permanent: true, direction: 'top', className: 'font-bold text-xs -mt-2 bg-transparent border-0 shadow-none text-blue-500' });
      }

      // Create the Cluster Group with custom bubbles
      const clusterGroup = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true, // Spreads out markers if they share exact same coordinates
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="
                background-color: ${isDark ? '#fff' : '#000'}; 
                color: ${isDark ? '#000' : '#fff'};
                border: 2px solid ${isDark ? '#555' : '#ccc'};
                width: 40px; height: 40px; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center;
                font-weight: 900; font-size: 14px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            ">${count}+</div>`,
            className: 'custom-cluster-icon',
            iconSize: [40, 40]
          });
        }
      });

      const bounds = L.latLngBounds([]);

      shops.forEach(shop => {
        const isSelected = shop.id === selectedShopId;
        const initial = shop.name ? shop.name.charAt(0).toUpperCase() : 'S'; // First Letter
        
        // Beautiful Custom Shop Markers
        const shopIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="
                background-color: ${isSelected ? (isDark ? '#fff' : '#000') : (isDark ? '#222' : '#fff')}; 
                color: ${isSelected ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')};
                border: 2px solid ${isSelected ? (isDark ? '#fff' : '#000') : (isDark ? '#444' : '#ddd')};
                width: ${isSelected ? '44px' : '36px'}; 
                height: ${isSelected ? '44px' : '36px'}; 
                border-radius: 50%; 
                display: flex; align-items: center; justify-content: center;
                font-weight: 900; font-size: ${isSelected ? '18px' : '15px'};
                box-shadow: ${isSelected ? '0 0 20px rgba(0,0,0,0.4)' : '0 4px 10px rgba(0,0,0,0.1)'};
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: ${isSelected ? 1000 : 1};
            ">
                ${initial}
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22] 
        });

        const marker = L.marker([shop.latitude, shop.longitude], { icon: shopIcon });
        
        marker.on('click', () => {
          onShopSelect(shop.id);
        });

        marker.bindTooltip(shop.name, { direction: 'top', offset: [0, -20], className: 'font-bold text-xs' });
        
        clusterGroup.addLayer(marker);
        bounds.extend([shop.latitude, shop.longitude]);
      });

      mapRef.current.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;

      if (userLat && userLng) bounds.extend([userLat, userLng]);
      
      // Auto-fit map to show everything IF nothing is selected yet
      if (bounds.isValid() && !selectedShopId) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    };

    renderMarkers();
  }, [shops, selectedShopId, userLat, userLng, onShopSelect, isDark]);

  // ==========================================================
  // 3. LISTEN TO LIST CLICKS & SYNC MAP ZOOM
  // ==========================================================
  useEffect(() => {
    if (mapRef.current && selectedShopId && shops.length > 0) {
      const selectedShop = shops.find(s => s.id === selectedShopId);
      if (selectedShop) {
        // Zooming to level 17 forces any clusters to break open so the specific shop is visible
        mapRef.current.flyTo([selectedShop.latitude, selectedShop.longitude], 17, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }, [selectedShopId, shops]);

  return (
    <div 
      ref={mapContainerRef} 
      className={`w-full h-full min-h-[400px] z-0 transition-colors duration-500 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}
    />
  )
}