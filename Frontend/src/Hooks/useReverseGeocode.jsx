import { useState, useEffect } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;

const getAllSublocalityNames = (geocodeResults) => {
  const sublocalities = [];
  for (const result of geocodeResults) {
    for (const component of result.address_components) {
      if (component.types.includes("sublocality_level_1")) {
        if (!sublocalities.includes(component.short_name)) {
          sublocalities.push(component.short_name);
        }
      }
    }
  }
  return sublocalities.length > 0 ? sublocalities.join(", ") : "Unknown Location";
};

const useReverseGeocode = (lat, lng) => {
  const [locationName, setLocationName] = useState("Fetching location...");

  useEffect(() => {
    if (!lat || !lng) return;

    const fetchLocation = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          setLocationName(getAllSublocalityNames(data.results));
        } else {
          setLocationName("Unknown Location");
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        setLocationName("Error fetching location");
      }
    };

    fetchLocation();
  }, [lat, lng]);

  return locationName;
};

export default useReverseGeocode;
