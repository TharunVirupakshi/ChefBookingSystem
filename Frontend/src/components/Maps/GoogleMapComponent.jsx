import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useState, useCallback, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const GoogleMapComponent = ({ defaultLocation, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);

  useEffect(() => {
    setSelectedLocation(defaultLocation); // Ensure map starts at default location
  }, [defaultLocation]);

  const handleMapClick = useCallback(
    (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newLocation);
      onLocationSelect(newLocation); // Pass location to parent
    },
    [onLocationSelect]
  );

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation} // Start at default location
        zoom={14} // Adjust zoom as needed
        onClick={handleMapClick}
      >
        {selectedLocation && <Marker position={selectedLocation} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
