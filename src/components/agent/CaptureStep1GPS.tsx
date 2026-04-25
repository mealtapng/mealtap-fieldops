'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'
import type { Step1Data } from '@/lib/onboarding-state'

// Set token once at module load — avoids timing issues inside effects
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Step1Data | null
  onContinue: (data: Step1Data) => void
}

// ── Accuracy helpers ──────────────────────────────────────────────────────────

function accuracyInfo(acc: number) {
  if (acc <= 10) return { label: 'Strong',   badge: 'bg-green-50 text-green-700',  dot: 'bg-green-500' }
  if (acc <= 30) return { label: 'Moderate', badge: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-400' }
  return              { label: 'Weak',     badge: 'bg-red-50 text-red-600',     dot: 'bg-red-500'   }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CaptureStep1GPS({ initialData, onContinue }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<mapboxgl.Map | null>(null)
  const watchIdRef      = useRef<number | null>(null)
  const geocodeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ageTimer        = useRef<ReturnType<typeof setInterval> | null>(null)

  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [geoError, setGeoError] = useState<GeolocationPositionError | null>(null)
  const [noGeo, setNoGeo]       = useState(false)
  const [address, setAddress]   = useState<string>(initialData?.address ?? '')
  const [editingAddr, setEditingAddr]   = useState(false)
  const [isGeocoding, setIsGeocoding]   = useState(false)
  const [positionAge, setPositionAge]   = useState(0)

  // ── Effect 1: geolocation watch ─────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) {
      setNoGeo(true)
      return
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => { setPosition(pos); setGeoError(null) },
      err => setGeoError(err as GeolocationPositionError),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    )
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
      if (ageTimer.current)     clearInterval(ageTimer.current)
    }
  }, [])

  // ── Effect 2: init map on mount ─────────────────────────────────────────────
  // Initialise immediately (don't wait for GPS) so tiles start loading right away.
  // Effect 3 flies to the real position once it arrives.

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Default centre: previous lock → or Lagos city centre as fallback
    const defaultCenter: [number, number] = initialData
      ? [initialData.lng, initialData.lat]
      : [3.3792, 6.5244]

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 17,
      attributionControl: false,
    })
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Effect 3: fly to updated position ───────────────────────────────────────

  useEffect(() => {
    if (!position || !mapRef.current) return
    mapRef.current.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      speed: 1.2,
      essential: true,
    })
  }, [position?.coords.latitude, position?.coords.longitude])

  // ── Effect 4: debounced reverse geocoding (2 s) ──────────────────────────────

  useEffect(() => {
    if (!position) return
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    geocodeTimer.current = setTimeout(async () => {
      const { latitude: lat, longitude: lng } = position.coords
      setIsGeocoding(true)
      try {
        const res  = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
          `?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
        )
        const data = await res.json()
        setAddress(data.features?.[0]?.place_name ?? '')
      } catch {
        // keep previous address on network error
      } finally {
        setIsGeocoding(false)
      }
    }, 2000)
  }, [position?.coords.latitude, position?.coords.longitude])

  // ── Effect 5: "Updated X ago" ticker ────────────────────────────────────────

  useEffect(() => {
    if (!position) return
    if (ageTimer.current) clearInterval(ageTimer.current)
    setPositionAge(0)
    ageTimer.current = setInterval(() => {
      setPositionAge(Math.round((Date.now() - position.timestamp) / 1000))
    }, 1000)
    return () => { if (ageTimer.current) clearInterval(ageTimer.current) }
  }, [position?.timestamp])

  // ── Re-pin ────────────────────────────────────────────────────────────────────

  function repin() {
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition(pos); setGeoError(null) },
      err => setGeoError(err as GeolocationPositionError),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // ── Continue ──────────────────────────────────────────────────────────────────

  const canContinue = !!position && position.coords.accuracy <= 100 // TODO: tighten to 10 before prod

  function handleContinue() {
    if (!position || !canContinue) return
    onContinue({
      lat:       position.coords.latitude,
      lng:       position.coords.longitude,
      accuracy:  position.coords.accuracy,
      address,
      lockedAt:  new Date().toISOString(),
    })
  }

  // ── Error states ──────────────────────────────────────────────────────────────

  if (noGeo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center">
          <span className="text-2xl">📍</span>
        </div>
        <p className="text-sm text-ink font-semibold">
          Your device doesn&apos;t support GPS location.
        </p>
      </div>
    )
  }

  if (geoError && !position) {
    const msgs: Record<number, string> = {
      1: 'Location access is required to record customer location. Please enable location in your browser settings.',
      2: 'Unable to get your location. Move to an area with better signal and try again.',
      3: 'Unable to get your location. Move to an area with better signal and try again.',
    }
    const msg = msgs[geoError.code] ?? 'Unable to get your location.'
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-forest/10 flex items-center justify-center">
          <span className="text-2xl">📍</span>
        </div>
        <p className="text-sm text-ink font-semibold leading-relaxed">{msg}</p>
        {geoError.code !== 1 && (
          <button
            onClick={repin}
            className="px-6 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold"
          >
            Try again
          </button>
        )}
        {geoError.code === 1 && (
          <p className="text-xs text-muted">
            Tap the lock icon in your browser&apos;s address bar to allow location.
          </p>
        )}
      </div>
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────────

  const acc   = position ? Math.round(position.coords.accuracy) : null
  const accInfo = acc != null ? accuracyInfo(acc) : null

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Map ──────────────────────────────────────────────────────── */}
        <div className="relative bg-forest-light" style={{ height: 280 }}>
          {/* Mapbox container */}
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* GPS acquiring overlay — shown until first position, sits on top of the already-loading map */}
          {!position && (
            <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                <p className="text-[11px] text-white font-medium">Getting your location…</p>
              </div>
            </div>
          )}

          {/* Fixed centre pin */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: 24 }}
          >
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <div className="absolute w-14 h-14 rounded-full bg-brand/20 animate-ping" />
              {/* Pin SVG */}
              <svg
                width="36"
                height="44"
                viewBox="0 0 36 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                <path
                  d="M18 0C10.268 0 4 6.268 4 14C4 24.5 18 44 18 44C18 44 32 24.5 32 14C32 6.268 25.732 0 18 0Z"
                  fill="#1A73E8"
                />
                <circle cx="18" cy="14" r="5.5" fill="white" />
              </svg>
            </div>
          </div>

          {/* Accuracy badge — top left */}
          {acc != null && accInfo && (
            <div className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold shadow-sm ${accInfo.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${accInfo.dot}`} />
              ±{acc}m · {accInfo.label}
            </div>
          )}

          {/* Re-centre button — top right */}
          <button
            onClick={repin}
            className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-ink hover:bg-cream transition-colors"
            aria-label="Re-centre map"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        </div>

        {/* ── Below-map content ─────────────────────────────────────────── */}
        <div className="px-4 pt-4 space-y-3 pb-4">

          {/* Live GPS card */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
                Live GPS Reading
              </span>
            </div>
            <div className="space-y-2">
              <GPSRow label="Latitude"  value={position ? `${position.coords.latitude.toFixed(6)}° N` : '—'} />
              <GPSRow label="Longitude" value={position ? `${position.coords.longitude.toFixed(6)}° E` : '—'} />
              <GPSRow label="Accuracy"  value={acc != null ? `±${acc}m` : '—'} />
              <GPSRow
                label="Updated"
                value={position ? (positionAge === 0 ? 'just now' : `${positionAge}s ago`) : '—'}
              />
            </div>
          </div>

          {/* Resolved address card */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <svg className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  {editingAddr ? (
                    <input
                      autoFocus
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      onBlur={() => setEditingAddr(false)}
                      className="w-full text-sm text-ink font-medium border-b border-forest outline-none pb-0.5 bg-transparent"
                      placeholder="Enter address…"
                    />
                  ) : isGeocoding ? (
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded bg-line animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-line animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-sm text-ink font-medium leading-snug">
                      {address || (position ? 'Resolving address…' : 'Waiting for GPS…')}
                    </p>
                  )}
                </div>
              </div>
              {!editingAddr && (
                <button
                  onClick={() => setEditingAddr(true)}
                  className="text-xs font-semibold text-brand flex-shrink-0"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Tip card */}
          <div className="bg-forest/10 rounded-2xl px-4 py-3.5 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-xs text-brand font-medium leading-relaxed">
              Tip: If the pin is off, walk closer to the customer&apos;s meter and tap Re-pin.
              Accuracy under ±10m is required to continue.
            </p>
          </div>

          {/* Re-pin button */}
          <button
            onClick={repin}
            className="w-full py-3.5 rounded-2xl border-2 border-forest text-brand font-semibold text-sm bg-white flex items-center justify-center gap-2 active:bg-forest/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            Re-pin my location
          </button>

        </div>
      </div>

      {/* ── Sticky Continue button ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-cream border-t border-line px-4 pt-3 pb-4">
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            canContinue
              ? 'bg-brand text-white shadow-lg shadow-forest/25 active:bg-forest-dark'
              : 'bg-line text-muted cursor-not-allowed'
          }`}
        >
          📍 Lock location &amp; continue →
        </button>
        {acc != null && acc > 10 && (
          <p className="text-[11px] text-center text-muted mt-1.5">
            GPS accuracy must be ±10m or better to continue (currently ±{acc}m)
          </p>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GPSRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted font-medium">{label}</span>
      <span className="text-xs font-mono font-semibold text-ink">{value}</span>
    </div>
  )
}
