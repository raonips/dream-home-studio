import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import SmartMap from '@/components/SmartMap';

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLatChange: (val: string) => void;
  onLngChange: (val: string) => void;
}

const LocationPicker = ({ latitude, longitude, onLatChange, onLngChange }: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const lat = parseFloat(latitude) || -12.72;
  const lng = parseFloat(longitude) || -38.36;
  const hasCoords = !!(parseFloat(latitude) && parseFloat(longitude));

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        onLatChange(String(parseFloat(data[0].lat).toFixed(6)));
        onLngChange(String(parseFloat(data[0].lon).toFixed(6)));
      }
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const handleMapClick = (clickLat: number, clickLng: number) => {
    onLatChange(String(clickLat.toFixed(6)));
    onLngChange(String(clickLng.toFixed(6)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold">Localização no Mapa</Label>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar endereço..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
        />
        <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Latitude</Label>
          <Input
            type="number"
            step="0.000001"
            placeholder="-12.720000"
            value={latitude}
            onChange={(e) => onLatChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Longitude</Label>
          <Input
            type="number"
            step="0.000001"
            placeholder="-38.360000"
            value={longitude}
            onChange={(e) => onLngChange(e.target.value)}
          />
        </div>
      </div>

      {hasCoords && (
        <div className="rounded-lg overflow-hidden border border-border">
          <SmartMap
            latitude={lat}
            longitude={lng}
            privacy="exact"
            className="w-full h-[250px]"
            zoom={15}
            interactive
            onLocationSelect={handleMapClick}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Clique no mapa ou busque um endereço para definir as coordenadas.
      </p>
    </div>
  );
};

export default LocationPicker;
