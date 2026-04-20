'use client'

import { useEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export default function RestaurantDetailMap({
  lat,
  lng,
  name,
}: {
  lat: number
  lng: number
  name: string
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
        center: [lng, lat],
        zoom: 15,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

      const onLoad = () => {
        map.resize()

        const el = document.createElement('div')
        el.style.cssText = [
          'width: 18px',
          'height: 18px',
          'border-radius: 50%',
          'background: #C8622A',
          'border: 3px solid white',
          'box-shadow: 0 2px 6px rgba(0,0,0,0.5)',
          'cursor: pointer',
        ].join('; ')

        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, maxWidth: '180px' })
          .setHTML(`<p style="font-family: Poppins, sans-serif; font-weight: 700; font-size: 13px; margin: 0; color: #1a1a1a;">${name}</p>`)

        new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map)
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

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '300px' }}
      className="rounded-xl overflow-hidden"
    />
  )
}
