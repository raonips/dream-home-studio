import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

declare global {
  interface Window {
    google?: any;
  }
}

interface SmartMapProps {
  latitude: number;
  longitude: number;
  privacy?: 'exact' | 'approximate';
  title?: string;
  className?: string;
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LeafletMap = ({ latitude, longitude, privacy = 'exact', title, className, zoom = 14, interactive = true, onLocationSelect }: SmartMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: interactive,
      dragging: interactive,
      zoomControl: interactive,
    }).setView([latitude, longitude], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (privacy === 'approximate') {
      markerRef.current = L.circle([latitude, longitude], {
        radius: 500,
        color: 'hsl(var(--primary))',
        fillColor: 'hsl(var(--primary))',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
      if (title) (markerRef.current as L.Marker).bindPopup(title);
    }

    if (onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position when lat/lng changes (for admin picking)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    if (privacy === 'approximate') {
      markerRef.current = L.circle([latitude, longitude], {
        radius: 500,
        color: 'hsl(var(--primary))',
        fillColor: 'hsl(var(--primary))',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    } else {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
      if (title) (markerRef.current as L.Marker).bindPopup(title);
    }

    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, privacy, title]);

  return <div ref={mapRef} className={className || 'w-full h-[400px] rounded-xl'} />;
};

const GoogleMap = ({ latitude, longitude, privacy = 'exact', title, className, zoom = 14, interactive = true, onLocationSelect }: SmartMapProps & { apiKey: string }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom,
      gestureHandling: interactive ? 'auto' : 'none',
      zoomControl: interactive,
      disableDefaultUI: !interactive,
    });

    if (privacy === 'approximate') {
      markerRef.current = new window.google.maps.Circle({
        center: { lat: latitude, lng: longitude },
        radius: 500,
        fillColor: '#2563eb',
        fillOpacity: 0.15,
        strokeColor: '#2563eb',
        strokeWeight: 2,
        map,
      });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title,
      });
    }

    if (onLocationSelect) {
      map.addListener('click', (e: any) => {
        if (e.latLng) {
          onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (markerRef.current) {
      if ('setMap' in markerRef.current) markerRef.current.setMap(null);
    }

    if (privacy === 'approximate') {
      markerRef.current = new window.google.maps.Circle({
        center: { lat: latitude, lng: longitude },
        radius: 500,
        fillColor: '#2563eb',
        fillOpacity: 0.15,
        strokeColor: '#2563eb',
        strokeWeight: 2,
        map,
      });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title,
      });
    }

    map.setCenter({ lat: latitude, lng: longitude });
  }, [latitude, longitude, privacy, title]);

  return <div ref={mapRef} className={className || 'w-full h-[400px] rounded-xl'} />;
};

const SmartMap = (props: SmartMapProps) => {
  const settings = useSiteSettings();
  const [googleLoaded, setGoogleLoaded] = useState(!!window.google?.maps);
  const useGoogle = settings.map_provider === 'google' && !!settings.google_maps_api_key;

  useEffect(() => {
    if (!useGoogle || window.google?.maps) return;

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${settings.google_maps_api_key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, [useGoogle, settings.google_maps_api_key]);

  if (!props.latitude || !props.longitude) return null;

  if (useGoogle && googleLoaded) {
    return <GoogleMap {...props} apiKey={settings.google_maps_api_key} />;
  }

  return <LeafletMap {...props} />;
};

export default SmartMap;
