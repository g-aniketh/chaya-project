import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useState } from 'react';
import { toast } from 'sonner';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  timestamp: number;
}

interface LocationButtonProps {
  onLocationUpdate: (location: LocationData) => void;
  fieldIndex: number;
}

export function LocationButton({ onLocationUpdate }: LocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          timestamp: position.timestamp,
        };
        onLocationUpdate(locationData);
        setIsLoading(false);
        toast.success('Location updated successfully');
      },
      error => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        toast.error(errorMessage);
        setIsLoading(false);
      },
      options
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={getCurrentLocation}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
      {isLoading ? 'Getting Location...' : 'Get Current Location'}
    </Button>
  );
}
