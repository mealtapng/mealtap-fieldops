'use client'

import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

type Onboarding = {
  id:                string
  user_name:         string
  address:           string | null
  lat:               number | null
  lng:               number | null
  conversion_status: string | null
  agent_name:        string
  created_at:        string
}

type Zone = {
  id:         string
  name:       string
  center_lat: number | null
  center_lng: number | null
  radius_km:  number
}

type StatusCounts = {
  converted: number
  pending:   number
  failed:    number
}

const STATUS_COLORS: Record<string, string> = {
  converted: '#34A853',
  pending:   '#F59E0B',
  failed:    '#9CA3AF',
}

const STATUS_LABELS: Record<string, string> = {
  converted: 'Converted',
  pending:   'Pending',
  failed:    'Not interested',
}

// Generates a circle polygon as [lng, lat] coordinate pairs
function makeCirclePolygon(lat: number, lng: number, radiusKm: number, steps = 64): number[][] {
  const coords: number[][] = []
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
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
      paint: { 'fill-color': '#1A73E8', 'fill-opacity': 0.06 },
    })
    map.addLayer({
      id: `zone-line-${zone.id}`,
      type: 'line',
      source: `zone-fill-${zone.id}`,
      paint: {
        'line-color': '#1A73E8',
        'line-opacity': 0.3,
        'line-width': 1.5,
        'line-dasharray': [3, 3],
      },
    })

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
        'text-color': '#1A73E8',
        'text-opacity': 0.7,
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    })
  }
}

function addOnboardingMarkers(map: mapboxgl.Map, onboardings: Onboarding[]) {
  for (const r of onboardings) {
    if (r.lat == null || r.lng == null) continue

    const color = STATUS_COLORS[r.conversion_status ?? ''] ?? '#9CA3AF'
    const label = STATUS_LABELS[r.conversion_status ?? ''] ?? r.conversion_status ?? '—'
    const date  = r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'

    const el = document.createElement('div')
    el.style.cssText = [
      'width: 18px',
      'height: 18px',
      'border-radius: 50%',
      `background: ${color}`,
      'border: 3px solid white',
      'box-shadow: 0 2px 6px rgba(0,0,0,0.5)',
      'cursor: pointer',
      'z-index: 1',
    ].join('; ')

    const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, maxWidth: '220px' })
      .setHTML(`
        <div style="font-family: Poppins, sans-serif; padding: 2px 0;">
          <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px; color: #202124; line-height: 1.3;">${r.user_name}</p>
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
  onboardings,
  zones,
  statusCounts,
}: {
  onboardings:  Onboarding[]
  zones:        Zone[]
  statusCounts: StatusCounts
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return
    const container = mapContainerRef.current

    const timer = setTimeout(() => {
      if (mapRef.current) return

      const map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [3.3792, 6.5244], // Lagos [lng, lat]
        zoom: 12,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

      const onLoad = () => {
        map.resize()
        addZoneOverlays(map, zones)
        addOnboardingMarkers(map, onboardings)
      }
      if (map.isStyleLoaded()) {
        onLoad()
      } else {
        map.on('load', onLoad)
      }

      const observer = new ResizeObserver(() => map.resize())
      observer.observe(container)
      map.once('remove', () => observer.disconnect())
    }, 0)

    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const legendItems = [
    { status: 'converted', label: 'Converted',      count: statusCounts.converted },
    { status: 'pending',   label: 'Pending',         count: statusCounts.pending   },
    { status: 'failed',    label: 'Not interested',  count: statusCounts.failed    },
  ]

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: 'calc(100vh - 120px)' }}
      />

      {/* Legend overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-sm border border-line p-3 min-w-[150px]">
        <p className="text-[10px] font-bold tracking-widest text-muted-brand uppercase mb-2">Legend</p>
        <div className="space-y-1.5">
          {legendItems.map(({ status, label, count }) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ background: STATUS_COLORS[status] }}
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
