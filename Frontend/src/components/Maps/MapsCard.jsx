import React, { useRef, useCallback } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",

};

// Default coordinates (Example: Bangalore, India)
const DEFAULT_LATITUDE = 12.9716;
const DEFAULT_LONGITUDE = 77.5946;


const MapsCard = ({ latitude = DEFAULT_LATITUDE, longitude = DEFAULT_LONGITUDE}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY,
  });

  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  const position = { lat: latitude, lng: longitude };

  // Font Awesome SVG marker as a data URL
  const svgMarker = {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="#fb4f3c" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
    `),
    scaledSize: new window.google.maps.Size(40, 40), // Adjust size here
    anchor: new window.google.maps.Point(20, 40), // Anchor point for the icon
  };

  return (
    <div className="w-full h-full block">
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={position}
      zoom={15}
      onLoad={onMapLoad}
    >
      <MarkerF position={position} icon={svgMarker} />
    </GoogleMap>
    </div>
  );
};

export default MapsCard;
