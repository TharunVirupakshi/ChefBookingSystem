import { GoogleMap, LoadScript, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useState, useRef, useCallback, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const GoogleMapComponent = ({ defaultLocation, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState({ lat: 0, lng: 0 });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY,
  });

  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    setSelectedLocation(defaultLocation);
  }, [defaultLocation]);

  const handleMapClick = useCallback(
    (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newLocation);
      onLocationSelect(newLocation);
    },
    [onLocationSelect]
  );

  // Move marker definition inside `isLoaded` check
  const svgMarker = isLoaded
    ? {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
          <path fill="#fb4f3c" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
        </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      }
    : null;

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={selectedLocation}
      zoom={16}
      onClick={handleMapClick}
      onLoad={onMapLoad}
    >
      {selectedLocation && <MarkerF position={selectedLocation} icon={svgMarker} />}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
