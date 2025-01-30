import { useEffect, useState } from 'react';
import InstantOrderCard from '../../../components/InstantOrderCard/InstantOrderCard';
import MapsCard from '../../../components/Maps/MapsCard';
import { useNotification } from '../../../context/NotificationsContext';
import { toast } from "react-toastify";


const ManageChefOrders = ({chef_id}) => {
  const [status, setStatus] = useState('');
  const [instantBookingNotification, setInstantBookingNotification] = useState(null);
  const [locationName, setLocationName] = useState("Loading location...");
  const [orderLocationName, setOrderLocationName] = useState("");
  const { notifications, clearNotification } = useNotification();
  const [accepted, setAccepted] = useState(false);
  const [ttl, setTtl] = useState(0)
  // const [isCardOpen, setIsCardOpen] = useState(true);
  const [orderId,setOrderId] = useState(0)
  const [recipeData,setRecipeData] = useState(null)
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);


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




  const reverseGeocodeForOrder = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );

        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            console.log("Geocoded Order Location Data:", data);
            
            // Extract meaningful address (e.g., city, sublocality)
            const locationName = getAllSublocalityNames(data.results);
            setOrderLocationName(locationName || "Unknown Location");
        } else {
            setOrderLocationName("Unknown Location");
        }
    } catch (error) {
        console.error("Error fetching order location:", error);
        setOrderLocationName("Error fetching location");
    }
};




  // Load the single Instant Booking notification
  useEffect(() => {
    const latestInstantBooking = notifications.filter(
      (notif) =>
        notif.type &&
        notif.type.toUpperCase() === "INSTANT_BOOKING" &&
        notif.data?.notification_id
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]; // Take the most recent one

    if (latestInstantBooking) {

      // Send API req to see if the req is still valid. 

      setInstantBookingNotification(latestInstantBooking);

      const lat = parseFloat(latestInstantBooking.data.latitude);
      const lng = parseFloat(latestInstantBooking.data.longitude);

      // Trigger reverse geocoding
      if (lat && lng) {
        reverseGeocode(lat, lng);
      }

      // Initialize SSE for TTL updates
      const eventSource = new EventSource(
      `http://localhost:3000/api/orders/sse/instant-booking/${latestInstantBooking.data.chef_id}`
      );

      eventSource.onmessage = (event) => {
      const { ttl, expired, trueTtl, status } = JSON.parse(event.data);

      console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);

      // Keep logging until trueTtl reaches 0
      if (trueTtl > 0) {
        // Update TTL in state if not fully expired
        if (!expired) {
          setTtl(ttl);
        } else {
          setTtl(0); // Display 0 for the visible timer
          setInstantBookingNotification(null); // Clear notification
          clearNotification(latestInstantBooking.data.notification_id);
        }
      } else {
        // Once trueTtl is 0, stop logging and clear notification
        console.log("True TTL reached 0. Closing SSE.");
        eventSource.close(); // Close the SSE stream
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close(); // Ensure SSE is closed on error
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
    }
  }, [notifications]);


  

  // const handleReject = (notif_id) => {

  //   // Send API request to cancel the order

  //   clearNotification(notif_id); // Local storage

  //   setInstantBookingNotification(null);
  // };


  useEffect(() => {
    console.log("Received  in ManageChefOrders:", chef_id);
 
    // Use chef_id for API calls or other logic
  }, [chef_id]);


  const handleStatusUpdate = async (newStatus) => {
    if (!chef_id) {
      toast.error("User ID is missing. Please try again.");
      return;
    }

    const requestData = {
      chef_id: chef_id,
      status: newStatus
    };

    try {
      const response = await fetch("http://localhost:3000/api/chefs/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(newStatus); // Update local status
        toast.success(result.message || `Chef status updated to ${newStatus}`);
      } else {
        toast.error(result.message || "Failed to update chef status.");
      }
    } catch (error) {
      console.error("Error updating chef status:", error);
      toast.error("An error occurred. Please try again.");
    }
  };





  const handleAccept = async () => {
    if (!instantBookingNotification || !chef_id) {
      toast.error("Missing required data to accept the order.");
      return;
    }

    const { customer_id, recipe_id } = instantBookingNotification.data;

    try {
      const response = await fetch("http://localhost:3000/api/orders/instant/response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chef_id: chef_id,
          customer_id,
          recipe_id,
          response: "ACCEPT",
        }),
      });

      const result = await response.json();
      console.log('Accept response: ', result)

      if (result.success) {
        console.log("Order ID:", result.orderId);
        setOrderId(result?.orderId)
        toast.success("Order accepted successfully.");
        // setAccepted(true)
        setInstantBookingNotification(null);
        clearNotification(instantBookingNotification.data.notification_id);
      } else {
        toast.error(result.message || "Failed to accept the order.");
      }
    } catch (error) {
      console.error("Error accepting the order:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleReject = async () => {
  if (!instantBookingNotification || !chef_id) {
    toast.error("Missing required data to reject the order.");
    return;
  }
  console.log('instantordernotification...',instantBookingNotification.data)

  const { customer_id, recipe_id } = instantBookingNotification.data;

  try {
    const response = await fetch("http://localhost:3000/api/orders/instant/response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chef_id: chef_id,
        customer_id,
        recipe_id,
        response: "REJECT", // Reject the order
      }),
    });

    const result = await response.json();

    if (response.ok) {
      toast.success("Order rejected successfully.");
      setInstantBookingNotification(null);
      clearNotification(instantBookingNotification.data.notification_id);
      setAccepted(false);
    } else {
      toast.error(result.message || "Failed to reject the order.");
    }
  } catch (error) {
    console.error("Error rejecting the order:", error);
    toast.error("An error occurred. Please try again.");
  }
};

const fetchOrder = async () => {
    if (!chef_id) return; // Ensure chef_id exists

    try {
        setLoading(true);

        console.log("🔹 Fetching orders for chef_id:", chef_id);

        const response = await fetch(`http://localhost:3000/api/orders/${chef_id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Order Data Fetched:", result);
            setOrderData(result);
            toast.success("Order fetched successfully!");
            // 🔹 Fetch recipe data using orderData's recipe_id
             // Reverse geocode location for orderData
             if (result.latitude && result.longitude) {
                reverseGeocodeForOrder(result.latitude, result.longitude);
            }
            if (result.recipe_id) {
                fetchRecipe(chef_id, result.recipe_id);
            }
        } else {
            console.error("❌ Error fetching order:", result.message);
            setOrderData(null);
            setOrderLocationName("Unknown Location");
            setRecipeData(null);
            toast.error(result.message || "Failed to fetch order.");
        }
    } catch (error) {
        console.error("❌ Error fetching order:", error);
        setOrderData(null);
        setOrderLocationName("Error fetching location");
        setRecipeData(null);
        toast.error("An error occurred. Please try again.");
    } finally {
        setLoading(false);
    }
};

// 🔹 Fetch when `chef_id` changes
useEffect(() => {
    fetchOrder();
}, [chef_id]);

const fetchRecipe = async (chefId, recipeId) => {
    try {
        console.log(`🔹 Fetching recipe for chef_id: ${chefId}, recipe_id: ${recipeId}`);

        const response = await fetch(`http://localhost:3000/api/recipes/${chefId}/${recipeId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        const result = await response.json();

        if (response.ok) {
            console.log("✅ Recipe Data Fetched:", result);
            setRecipeData(result);
        } else {
            console.error("❌ Error fetching recipe:", result.message);
            setRecipeData(null);
        }
    } catch (error) {
        console.error("❌ Error fetching recipe:", error);
        setRecipeData(null);
    }
};

  

// const handleComplete = async() => {
//   if (!orderId || !chef_id) {
//     toast.error("Missing required data to complete the order.");
//     return;
//   }
//   try {
//     const response = await fetch("http://localhost:3000/api/orders/update-instant-book", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         orderId, // Pass the orderId from state
//         chef_id: chef_id, // Pass the chef_id as chef_id
//       }),
//     });

//     const result = await response.json();
//     console.log('Complete response:', result);

//     if (result.message === "Instant book status updated to COMPLETED") {
//       toast.success("Order marked as completed.");
//       setAccepted(false);
//       // Optionally, close the card after completion
//       handleCloseCard(); // You can call this if you want to close the card after completing the order
//     } else {
//       toast.error("Failed to complete the order.");
//     }
//   } catch (error) {
//     console.error("Error completing the order:", error);
//     toast.error("Error completing the order.");
//   }
//   };

  // const handleCloseCard = () => {
  //   setIsCardOpen(false); // Close the card
  // };



  return (
    <div className="bg-slate-100 p-10 rounded-md shadow-md h-screen">
      <h1 className="font-normal text-xl text-gray-500 underline underline-offset-4">
        Overview
      </h1>

      {/* <div className="flex justify-end gap-6">
         <button
          onClick={() => handleStatusUpdate("READY")}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-300"
        >
         Ready
        </button>
        <button
            onClick={() => handleStatusUpdate("BUSY")}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-300"
        >
          Busy
        </button>
      </div> */}

<div className='w-full flex items-end justify-end'>
      <button
  onClick={() => {
    const nextStatus = status === "READY" ? "BUSY" : "READY"; // Toggle between READY and BUSY
    handleStatusUpdate(nextStatus);
  }}
  className={`px-6 py-3 rounded-lg transition duration-300 ${
    status === "READY"
      ? "bg-red-500 hover:bg-red-600 text-white" // Display BUSY styles when READY
      : "bg-green-500 hover:bg-green-600 text-white" // Display READY styles when BUSY
  }`}
>
  {status === "READY" ? "BUSY" : "READY"}
</button>
</div>
      <h3>Current Status: {status ? status : "Not Set"}</h3>


      <div className="py-5 flex gap-2">
        {instantBookingNotification ? (
          <div className="flex gap-2 w-full">
            {/* Instant Order Card with notification details */}
            <InstantOrderCard
              timeRemaining={ttl}
              title={instantBookingNotification.data.recipe_title || ''}
              description={instantBookingNotification.body}
              recipeId={instantBookingNotification.data.recipe_id}
              customerId={instantBookingNotification.data.customer_id}
              location={locationName} // Pass the resolved location name
              onAccept={handleAccept}
              onReject={() => handleReject(instantBookingNotification.data.notification_id)}
              // onComplete={handleComplete}
              // accepted={accepted}
              // onClose={handleCloseCard}
            />
            
            {/* Map displaying customer location */}
            <div className="w-full border rounded-lg overflow-hidden">
              <MapsCard
                latitude={parseFloat(instantBookingNotification.data.latitude) || 12.9716}
                longitude={parseFloat(instantBookingNotification.data.longitude) || 77.5946}
              />
            </div>
          </div>
          ) : orderData && recipeData?.length > 0 ? (
    <div className="flex gap-2 w-full">
      {/* Instant Order Card for fetched orderData */}
      <InstantOrderCard
       title={`Order ${recipeData[0]?.title}`}
        description={`Total Price: ₹${orderData.total_price}`}
        recipeId={orderData.recipe_id}
        customerId={orderData.customer_id}
        location={orderLocationName}
        onComplete={() => handleComplete(orderData.order_id)}
      />
      <div className="w-full border rounded-lg overflow-hidden">
        <MapsCard
          latitude={parseFloat(orderData.latitude) || 12.9716}
          longitude={parseFloat(orderData.longitude) || 77.5946}
        />
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
