import { useEffect, useMemo, useRef, useState } from 'react'

import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export type VaultVenueMapPoint = {
  id: string
  name: string
  city: string
  region: string | null
  latitude: number
  longitude: number
  momentCount: number
}

type VaultVenueMapProps = {
  points: VaultVenueMapPoint[]
  selectedVenueId: string | null
  onSelectVenue: (venueId: string) => void
}

function getBounds(points: VaultVenueMapPoint[]) {
  const lons = points.map((point) => point.longitude)
  const lats = points.map((point) => point.latitude)

  return new maplibregl.LngLatBounds(
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  )
}

export function VaultVenueMap({
  points,
  selectedVenueId,
  onSelectVenue,
}: VaultVenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedVenueId) ?? null,
    [points, selectedVenueId],
  )

  useEffect(() => {
    if (!mapContainerRef.current || points.length === 0) {
      return
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      center: [points[0].longitude, points[0].latitude],
      container: mapContainerRef.current,
      dragRotate: false,
      pitchWithRotate: false,
      scrollZoom: false,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      zoom: points.length > 1 ? 3.5 : 10,
    })

    mapRef.current = map

    map.on('load', () => {
      if (!mapRef.current) {
        return
      }

      setStatus('ready')

      if (points.length > 1) {
        map.fitBounds(getBounds(points), {
          padding: 48,
        })
      }

      markersRef.current = points.map((point) => {
        const markerElement = document.createElement('button')
        markerElement.type = 'button'
        markerElement.className =
          'flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/85 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(2,6,23,0.55)]'
        markerElement.textContent = String(point.momentCount)
        markerElement.setAttribute(
          'aria-label',
          `${point.name}, ${point.momentCount} saved moments`,
        )
        markerElement.onclick = () => onSelectVenue(point.id)

        return new maplibregl.Marker({
          element: markerElement,
        })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map)
      })
    })

    map.on('error', () => {
      setStatus('error')
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [onSelectVenue, points])

  useEffect(() => {
    if (!mapRef.current || !selectedPoint) {
      return
    }

    mapRef.current.flyTo({
      center: [selectedPoint.longitude, selectedPoint.latitude],
      essential: true,
      zoom: Math.max(mapRef.current.getZoom(), 10),
    })
  }, [selectedPoint])

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/70">
      <div ref={mapContainerRef} className="h-[24rem] w-full" />

      {status === 'loading' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm text-slate-200 backdrop-blur-sm">
          Loading venue map...
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-sm text-rose-100 backdrop-blur-sm">
          The venue map could not load right now.
        </div>
      ) : null}
    </div>
  )
}
