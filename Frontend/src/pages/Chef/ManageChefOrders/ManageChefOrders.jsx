import { useEffect, useState } from 'react';
import InstantOrderCard from '../../../components/InstantOrderCard/InstantOrderCard';
import MapsCard from '../../../components/Maps/MapsCard';
import { useNotification } from '../../../context/NotificationsContext';


const ManageChefOrders = () => {
  const [instantBookingNotification, setInstantBookingNotification] = useState(null);
  const [locationName, setLocationName] = useState("Loading location...");
  const { notifications, clearNotification } = useNotification();

  // Google Maps Geocoding API Key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;

function getAllSublocalityNames(geocodeResults) {
    const sublocalities = [];

    for (const result of geocodeResults) {
        for (const component of result.address_components) {
            if (component.types.includes("sublocality_level_1")) {
                if (!sublocalities.includes(component.short_name)) {
                    sublocalities.push(component.short_name);  // Collect all unique matches
                }
            }
        }
    }

    return sublocalities.length > 0 ? sublocalities.join(", ") : "Unknown Location";
}


  // Reverse Geocode to get the address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        console.log("Geocoded data" ,data)
        const locName = getAllSublocalityNames(data.results)
        setLocationName(locName);
      } else {
        setLocationName("Unknown Location");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocationName("Error fetching location");
    }
  };

  // Load the single Instant Booking notification
  useEffect(() => {
    const latestInstantBooking = notifications.find(
      (notif) =>
        notif.type &&
        notif.type.toUpperCase() === "INSTANT_BOOKING" &&
        notif.data?.notification_id
    );

    if (latestInstantBooking) {
      setInstantBookingNotification(latestInstantBooking);

      const lat = parseFloat(latestInstantBooking.data.latitude);
      const lng = parseFloat(latestInstantBooking.data.longitude);

      // Trigger reverse geocoding
      // if (lat && lng) {
      //   reverseGeocode(lat, lng);
      // }
    }
  }, [notifications]);

  const handleReject = (notif_id) => {

    // Send API request to cancel the order

    clearNotification(notif_id); // Local storage

    setInstantBookingNotification(null);
  };

  return (
    <div className="bg-slate-100 p-10 rounded-md shadow-md h-screen">
      <h1 className="font-normal text-xl text-gray-500 underline underline-offset-4">
        Overview
      </h1>

      <div className="py-5 flex gap-2">
        {instantBookingNotification ? (
          <div className="flex gap-2 w-full">
            {/* Instant Order Card with notification details */}
            <InstantOrderCard
              title={instantBookingNotification.data.recipe_title || ''}
              description={instantBookingNotification.body}
              recipeId={instantBookingNotification.data.recipe_id}
              customerId={instantBookingNotification.data.customer_id}
              location={locationName} // Pass the resolved location name
              onAccept={() => console.log("Order Accepted")}
              onReject={() => handleReject(instantBookingNotification.data.notification_id)}
            />

            {/* Map displaying customer location */}
            <div className="w-full border rounded-lg overflow-hidden">
              {/* <MapsCard
                latitude={parseFloat(instantBookingNotification.data.latitude) || 12.9716}
                longitude={parseFloat(instantBookingNotification.data.longitude) || 77.5946}
              /> */}
            </div>
          </div>
        ) : (
          <div className="w-full text-center text-gray-500 py-10">
            <h2 className="text-lg">📭 You have no instant orders.</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageChefOrders;
