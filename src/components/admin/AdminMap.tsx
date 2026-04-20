'use client'

import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

type Restaurant = {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  tag: string | null
  agent_name: string
  created_at: string
}

type Zone = {
  id: string
  name: string
  center_lat: number | null
  center_lng: number | null
  radius_km: number
}

type TagCounts = {
  hot: number
  warm: number
  cold: number
  not_a_fit: number
}

const TAG_COLORS: Record<string, string> = {
  hot:       '#C8622A',
  warm:      '#2D5A27',
  cold:      '#9CA3AF',
  not_a_fit: '#D1D5DB',
}

const TAG_LABELS: Record<string, string> = {
  hot:       'Hot',
  warm:      'Warm',
  cold:      'Cold',
  not_a_fit: 'Not a fit',
}

// Generates a circle polygon as [lng, lat] coordinate pairs
function makeCirclePolygon(lat: number, lng: number, radiusKm: number, steps = 64): number[][] {
  const coords: number[][] = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    // dx is longitude offset, dy is latitude offset
    const dx = (radiusKm / 111.32) / Math.cos((lat * Math.PI) / 180) * Math.cos(angle)
    const dy = (radiusKm / 111.32) * Math.sin(angle)
    coords.push([lng + dx, lat + dy])
  }
  return coords
}

function addZoneOverlays(map: mapboxgl.Map, zones: Zone[]) {
  for (const zone of zones) {
    if (zone.center_lat == null || zone.center_lng == null) continue

    const coords = makeCirclePolygon(zone.center_lat, zone.center_lng, zone.radius_km)

    // Fill layer
    map.addSource(`zone-fill-${zone.id}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coords] },
      },
    })
    map.addLayer({
      id: `zone-fill-${zone.id}`,
      type: 'fill',
      source: `zone-fill-${zone.id}`,
      paint: {
        'fill-color': '#2D5A27',
        'fill-opacity': 0.06,
      },
    })

    // Dashed border layer
    map.addLayer({
      id: `zone-line-${zone.id}`,
      type: 'line',
      source: `zone-fill-${zone.id}`,
      paint: {
        'line-color': '#2D5A27',
        'line-opacity': 0.3,
        'line-width': 1.5,
        'line-dasharray': [3, 3],
      },
    })

    // Zone name label at centre
    map.addSource(`zone-label-${zone.id}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { name: zone.name },
        geometry: { type: 'Point', coordinates: [zone.center_lng, zone.center_lat] },
      },
    })
    map.addLayer({
      id: `zone-label-${zone.id}`,
      type: 'symbol',
      source: `zone-label-${zone.id}`,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#2D5A27',
        'text-opacity': 0.7,
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    })
  }
}

function addRestaurantMarkers(map: mapboxgl.Map, restaurants: Restaurant[]) {
  for (const r of restaurants) {
    if (r.lat == null || r.lng == null) continue

    const color = TAG_COLORS[r.tag ?? ''] ?? '#9CA3AF'
    const label = TAG_LABELS[r.tag ?? ''] ?? r.tag ?? '—'
    const date  = r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

    // Custom circle element
    const el = document.createElement('div')
    el.style.cssText = [
      'width: 12px',
      'height: 12px',
      'border-radius: 50%',
      `background: ${color}`,
      'border: 2px solid white',
      'box-shadow: 0 1px 4px rgba(0,0,0,0.3)',
      'cursor: pointer',
    ].join('; ')

    const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, maxWidth: '220px' })
      .setHTML(`
        <div style="font-family: Poppins, sans-serif; padding: 2px 0;">
          <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #1a1a1a; line-height: 1.3;">${r.name}</p>
          <p style="font-size: 11px; color: #6B7280; margin: 0 0 8px; line-height: 1.4;">${r.address ?? ''}</p>
          <span style="
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 9999px;
            background: ${color};
            color: white;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-bottom: 8px;
          ">${label}</span>
          <p style="font-size: 11px; color: #374151; margin: 0 0 2px;">by ${r.agent_name}</p>
          <p style="font-size: 11px; color: #9CA3AF; margin: 0;">${date}</p>
        </div>
      `)

    new mapboxgl.Marker({ element: el })
      .setLngLat([r.lng, r.lat])
      .setPopup(popup)
      .addTo(map)
  }
}

export default function AdminMap({
  restaurants,
  zones,
  tagCounts,
}: {
  restaurants: Restaurant[]
  zones: Zone[]
  tagCounts: TagCounts
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const container = mapContainerRef.current
    const map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [7.49, 9.06], // Abuja [lng, lat]
      zoom: 12,
      attributionControl: false,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.resize()
      addZoneOverlays(map, zones)
      addRestaurantMarkers(map, restaurants)
    })

    // Resize the map whenever the container changes size (e.g. sidebar toggle,
    // window resize, or dynamic layout settling after hydration).
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const legendItems = [
    { tag: 'hot',       label: 'Hot',       count: tagCounts.hot },
    { tag: 'warm',      label: 'Warm',      count: tagCounts.warm },
    { tag: 'cold',      label: 'Cold',      count: tagCounts.cold },
    { tag: 'not_a_fit', label: 'Not a fit', count: tagCounts.not_a_fit },
  ]

  return (
    <div className="absolute inset-0">
      {/* Map canvas */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Legend overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-sm border border-line p-3 min-w-[140px]">
        <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2">Legend</p>
        <div className="space-y-1.5">
          {legendItems.map(({ tag, label, count }) => (
            <div key={tag} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ background: TAG_COLORS[tag] }}
              />
              <span className="text-xs text-muted-brand">{label}</span>
              <span className="ml-auto text-xs font-semibold text-ink">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
