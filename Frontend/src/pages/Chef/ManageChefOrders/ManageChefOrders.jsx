import { useEffect, useState } from "react";
import OrderCard from "../../../components/OrderCard/OrderCard";
import MapsCard from "../../../components/Maps/MapsCard";
import { useNotification } from "../../../context/NotificationsContext";
import { toast } from "react-toastify";
import APIService from "../../../API/APIService";
import { auth } from "../../../Firebase/firebase";
import { initFlowbite } from "flowbite";
import getImgUrl from "../../../utils/images";
import { Button } from "flowbite-react";

const ManageChefOrders = ({ chef_id }) => {
  const [refresh, setReferesh] = useState(false);
  const [status, setStatus] = useState("");
  const [orderstatus, setOrderstatus] = useState("");
  const [completedOrders, setCompletedOrders] = useState([]);
  const [completedRecipes, setCompletedRecipes] = useState([]);
  const [instantBookingNotification, setInstantBookingNotification] =
    useState(null);
  const [latestCancelNotification, setLatestCancelNotification] =
    useState(null);
  const [locationName, setLocationName] = useState("Loading location...");
  const [orderLocationName, setOrderLocationName] = useState("");
  const { notifications, clearNotification } = useNotification();
  const [accepted, setAccepted] = useState(false);
  const [ttl, setTtl] = useState(null);
  // const [isCardOpen, setIsCardOpen] = useState(true);
  const [orderId, setOrderId] = useState(0);
  const [recipeData, setRecipeData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [chefGeolocation, setChefGeolocation] = useState({ lat: 0, long: 0 });
  const [loading, setLoading] = useState(false);

  // Google Maps Geocoding API Key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;

  function getAllSublocalityNames(geocodeResults) {
    const sublocalities = [];

    for (const result of geocodeResults) {
      for (const component of result.address_components) {
        if (component.types.includes("sublocality_level_1")) {
          if (!sublocalities.includes(component.short_name)) {
            sublocalities.push(component.short_name); // Collect all unique matches
          }
        }
      }
    }

    return sublocalities.length > 0
      ? sublocalities.join(", ")
      : "Unknown Location";
  }

  const getLocName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        console.log("Geocoded data", data);
        const locName = getAllSublocalityNames(data.results);
        return locName;
      } else {
        return "Unknown Location";
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      return "Unknown Location";
    }
  };

  // Reverse Geocode to get the address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        console.log("Geocoded data", data);
        const locName = getAllSublocalityNames(data.results);
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

  useEffect(() => {
    const saveLoc = (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
      };
      console.log("Chef location: ", loc);

      setChefGeolocation(loc);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(saveLoc, null, {
        enableHighAccuracy: true,
      });
    } else {
      alert("Geolocation is not supported by this browser!");
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const id = auth.currentUser.uid;
      const stat = await APIService.getChefStatus(id);
      setStatus(stat?.status);
    } catch (error) {
      console.log("Error fetching Chef status");
    }
  };

  useEffect(() => {
    initFlowbite();
    fetchStatus();
  }, []);

  // Load the single Instant Booking notification
  useEffect(() => {
    const latestInstantBooking = notifications
      .filter(
        (notif) =>
          notif.type &&
          notif.type.toUpperCase() === "INSTANT_BOOKING" &&
          notif.data?.notification_id
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]; // Take the most recent one

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
      // const eventSource = new EventSource(
      // `http://localhost:3000/api/orders/sse/instant-booking/${latestInstantBooking.data.chef_id}`
      // );

      // eventSource.onmessage = (event) => {
      // const { ttl, expired, trueTtl, status } = JSON.parse(event.data);

      const eventSource = APIService.listenToInstantBooking(
        latestInstantBooking.data.chef_id,
        (data) => {
          // ✅ No need for JSON.parse, `data` is already an object
          const { ttl, expired, trueTtl, status } = data;
          if (status) {
            console.log("Updating order status:", status);
            setOrderstatus(status); // ✅ Ensure status is updated early
          }

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
            // setOrderstatus(status)
            setInstantBookingNotification(null); // Clear notification
            clearNotification(latestInstantBooking.data.notification_id);
            eventSource.close(); // Close the SSE stream
          }
        },
        (error) => {
          console.error("SSE Error:", error);
        }
      );
      // eventSource.onerror = (err) => {
      //   console.error("SSE Error:", err);
      //   eventSource.close(); // Ensure SSE is closed on error
      // };

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

  const handleStatusUpdate = async (newStatus) => {
    if (!chef_id) {
      toast.error("User ID is missing. Please try again.");
      return;
    }

    // const requestData = {
    //   chef_id: chef_id,
    //   status: newStatus
    // };

    try {
      // const response = await fetch("http://localhost:3000/api/chefs/status", {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(requestData),
      // });

      const result = await APIService.updateChefStatus(chef_id, newStatus);

      // const result = await response.json();

      // if (response.ok) {
      //   // setStatus(newStatus); // Update local status
      //   toast.success(result.message || `Chef status updated to ${newStatus}`);
      // } else {
      //   toast.error(result.message || "Failed to update chef status.");
      // }

      if (result) {
        toast.success(result.message || `Chef status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update chef status.");
      }
    } catch (error) {
      console.error("Error updating chef status:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      fetchStatus();
    }
  };

  const handleAccept = async () => {
    if (!instantBookingNotification || !chef_id) {
      toast.error("Missing required data to accept the order.");
      return;
    }

    const { customer_id, recipe_id } = instantBookingNotification.data;

    console.log("Sending Accept Request with:");
    console.log("Chef ID:", chef_id);
    console.log("Customer ID:", customer_id);
    console.log("Recipe ID:", recipe_id);
    console.log("Chef Location:", chefGeolocation);

    if (!chefGeolocation || !chefGeolocation.lat || !chefGeolocation.long) {
      toast.error("Geolocation is missing or invalid.");
      return;
    }

    try {
      console.log("Sending API Request:", {
        chef_id: chef_id,
        customer_id,
        recipe_id,
        response: "ACCEPT",
        latitude: chefGeolocation.lat,
        longitude: chefGeolocation.long,
      });

      const result = await APIService.sendInstantResponse(
        chef_id,
        customer_id,
        recipe_id,
        "ACCEPT",
        chefGeolocation.lat,
        chefGeolocation.long
      );

      console.log("Accept response: ", result);

      if (result.success) {
        console.log("Order ID:", result.orderId);
        setOrderId(result?.orderId);
        toast.success("Order accepted successfully.");
        setInstantBookingNotification(null);
        clearNotification(instantBookingNotification.data.notification_id);
      } else {
        console.error("Server Error Response:", result);
        toast.error(result.message || "Failed to accept the order.");
      }
    } catch (error) {
      console.error("Error accepting the order:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      const id = auth.currentUser.uid;
      fetchOrder(id);
    }
  };

  const handleReject = async () => {
    if (!instantBookingNotification || !chef_id) {
      toast.error("Missing required data to reject the order.");
      return;
    }

    console.log("instantOrderNotification...", instantBookingNotification.data);

    const { customer_id, recipe_id, notification_id } =
      instantBookingNotification.data;

    if (!chefGeolocation) {
      toast.error("Chef location data is missing.");
      return;
    }

    try {
      const result = await APIService.sendInstantResponse(
        chef_id,
        customer_id,
        recipe_id,
        "REJECT",
        chefGeolocation.lat,
        chefGeolocation.long
      );

      console.log("Reject response:", result);

      if (result.success) {
        toast.success("Order rejected successfully.");
        setInstantBookingNotification(null); // Remove active order
        clearNotification(notification_id); // Clear notification
        setAccepted(false);
      } else {
        toast.error(result.message || "Failed to reject the order.");
      }
    } catch (error) {
      console.error("Error rejecting the order:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const fetchRecipe = async (chef_id, recipeId) => {
    try {
      console.log(
        `🔹 Fetching recipe for chef_id: ${chef_id}, recipe_id: ${recipeId}`
      );

      // const response = await fetch(`http://localhost:3000/api/recipes/${chef_id}/${recipeId}`, {
      //     method: "GET",
      //     headers: {
      //         "Content-Type": "application/json",
      //     }
      // });

      // const result = await response.json();
      const result = await APIService.fetchRecipeByChefIdAndRecipeId(
        chef_id,
        recipeId
      );

      if (result) {
        // console.log("✅ Recipe Data Fetched:", result);
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

  const fetchOrder = async (chef_id) => {
    if (!chef_id) {
      console.warn("⚠️ Missing required data to fetch the order.");
      toast.error("Missing required data to fetch the order.");
      return;
    }

    try {
      console.log("🔹 Fetching orders for chef_id:", chef_id);

      const result = await APIService.fetchCurrentInstantOrderByChefId(chef_id);

      if (!result || result.length === 0) {
        console.warn("ℹ️ No pending orders found.");
        setOrderData(null);
        toast.info("No pending orders found.");
        return;
      }

      console.log("✅ Order Data Fetched:", result);

      // Fetch locations for all orders in parallel
      const ordersWithLocation = await Promise.all(
        result.map(async (order) => {
          try {
            const locName = await getLocName(order.latitude, order.longitude);
            return { ...order, location: locName }; // Add location to order data
          } catch (error) {
            console.error(
              `❌ Error fetching location for order ${order.order_id}:`,
              error
            );
            return { ...order, location: "Unknown location" }; // Default if error occurs
          }
        })
      );

      setOrderData(ordersWithLocation);
    } catch (error) {
      console.error("❌ Unexpected error fetching orders:", error);

      // if (error.message !== "No orders found") {
      //   toast.error("An error occurred while fetching orders.");
      // }

      setOrderData(null);
    }
  };

  useEffect(() => {
    // console.log("Received chef_id in ManageChefOrders:", chef_id);
    const id = auth.currentUser.uid;
    fetchOrder(id);
  }, []);

  const handleComplete = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.updateInstantBookStatus(
        order_id,
        chef_id,
        "COMPLETED"
      );
      console.log("Complete response:", result);

      if (result.message === "Order status updated to COMPLETED") {
        toast.success("Order marked as completed.");
        // setAccepted(false);
        // handleCloseCard();
      } else {
        toast.error(result.message || "Failed to complete the order.");
      }
    } catch (error) {
      console.error("Error completing the order:", error);
      toast.error("Error completing the order.");
    } finally {
      const id = auth.currentUser.uid;
      fetchOrder(id);
    }
  };

  const handleClashCheck = async (order_id, chef_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.checkAdvancedClashes(order_id, chef_id);
      console.log("Clash response:", result);

      if (result.success) {
        toast.success("No clashes found");
      } else {
        toast.error(result.message || "Clashes found");
      }
    } catch (error) {
      console.error("Error checking clashes:", error);
      toast.error("Error checking clashes.");
    } finally {
      setReferesh((prev) => !prev);
    }
  };

  const handleAdvanceComplete = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.completeAdvanceBooking(order_id);
      console.log("Complete response:", result);

      if (result.success) {
        toast.success("Advance Order marked as completed.");
      } else {
        toast.error(result.message || "Failed to complete the advance order.");
      }
    } catch (error) {
      console.error("Error completing the order:", error);
      toast.error("Error completing the order.");
    } finally {
      setReferesh((prev) => !prev);
    }
  };
  const handleAdvanceCancel = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.cancelAdvanceBooking(order_id);
      console.log("Cancel response:", result);

      if (result.success) {
        toast.success("Advance Order marked as cancelled.");
      } else {
        toast.error(result.message || "Failed to cancel the advance order.");
      }
    } catch (error) {
      console.error("Error cancelling the order:", error);
      toast.error("Error cancelling the order.");
    } finally {
      setReferesh((prev) => !prev);
    }
  };
  const handleAdvanceAccept = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.confirmAdvanceBooking(order_id);
      console.log("Accept response:", result);

      if (result.success) {
        toast.success("Advance Order marked as confirmed.");
      } else {
        toast.error(result.message || "Failed to accept the advance order.");
      }
    } catch (error) {
      console.error("Error accepting the order:", error);
      toast.error("Error accepting the order.");
    } finally {
      setReferesh((prev) => !prev);
    }
  };
  const handleAdvanceReject = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.rejectAdvanceBooking(order_id);
      console.log("Reject response:", result);

      if (result.success) {
        toast.success("Advance Order marked as rejected.");
      } else {
        toast.error(result.message || "Failed to reject the advance order.");
      }
    } catch (error) {
      console.error("Error rejecting the order:", error);
      toast.error("Error rejecting the order.");
    } finally {
      setReferesh((prev) => !prev);
    }
  };

  const handleCancel = async (order_id) => {
    if (!order_id) toast.error("Order ID required");

    try {
      const result = await APIService.updateInstantBookStatus(
        order_id,
        chef_id,
        "CANCELLED"
      );
      console.log("Cancel response:", result);

      if (result.message === "Order status updated to CANCELLED") {
        toast.success("Order has been cancelled.");
        setAccepted(false);
        // handleCloseCard();
      } else {
        toast.error(result.message || "Failed to cancel the order.");
      }
    } catch (error) {
      console.error("Error cancelling the order:", error);
      toast.error("Error cancelling the order.");
    } finally {
      const id = auth.currentUser.uid;
      fetchOrder(id);
    }
  };

  const [todaysOrders, setTodaysOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  useEffect(() => {
    const fetchCompletedOrdersAndRecipes = async () => {
      try {
        // Fetch completed orders using APIService
        const orders = await APIService.fetchAllOrdersByChefId(chef_id);

        if (orders.length === 0) return;

        orders?.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        const ordersForToday = orders.filter((order) => {
          const date = new Date(order.start_date_time);
          return (
            order.type === "ADVANCE" &&
            date.toLocaleDateString() === new Date().toLocaleDateString() &&
            !["COMPLETED", "CANCELLED", "PENDING"].includes(order.status)
          );
        });

        const pendOrders = orders.filter(
          (order) => order.type === "ADVANCE" && order.status === "PENDING"
        );

        setCompletedOrders(orders);
        setTodaysOrders(ordersForToday);
        setPendingOrders(pendOrders);
        console.log("Orders for Today: ", ordersForToday);

        // // Fetch recipes for each order
        // const recipePromises = orders.map((order) =>
        //   APIService.fetchRecipeByChefIdAndRecipeId(chef_id, order.recipe_id)
        // );

        // const recipes = await Promise.all(recipePromises);
        // // console.log("Fetched Recipes:", recipes); // Debugging log
        // setCompletedRecipes(recipes);

        //Fetch customer details using customer_id
        //   const uniqueCustomerIds = [...new Set(orders.map((order) => order.customer_id))];

        //    // Fetch customer details in parallel
        // const customerPromises = uniqueCustomerIds.map((id) => APIService.getCustomerById(id));
        // const customers = await Promise.all(customerPromises);

        //  // Store customer data
        //  setCustomerData(customers);
      } catch (error) {
        console.error(
          "Error fetching completed orders, recipes and customers :",
          error
        );
      }
    };

    if (chef_id) {
      fetchCompletedOrdersAndRecipes();
    }
  }, [chef_id, orderData, refresh]);

  console.log("order status", orderstatus);
  // console.log("completed orders..", completedOrders);
  // console.log("completed recipes..", completedRecipes);

  return (
    <div className="bg-slate-100 p-10 rounded-md shadow-md min-h-screen">
      <h1 className="font-semibold text-xl text-gray-500">Overview</h1>

      <div className="w-full flex items-end justify-between p-10">
        <h3>
          Current Status:{" "}
          <span
            className={`${
              status === "READY"
                ? "text-green-500"
                : status === "BUSY"
                ? "text-red-500"
                : ""
            }`}
          >
            {status ? status : "Not Set"}
          </span>
        </h3>
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
      <h1 className="font-normal text-xl text-gray-500">Instant Orders</h1>
      <div className="py-5 flex gap-2">
        {instantBookingNotification ? (
          <div className="flex gap-2 w-full">
            {/* Instant Order Card with notification details */}
            <OrderCard
              timeRemaining={ttl}
              imageUrl={getImgUrl(
                parseInt(instantBookingNotification.data.recipe_id, 10) || -1
              )}
              title={instantBookingNotification.data.recipe_title || ""}
              description={instantBookingNotification.body}
              recipeId={instantBookingNotification.data.recipe_id}
              customerId={instantBookingNotification.data.customer_id}
              location={locationName} // Pass the resolved location name
              onAccept={handleAccept}
              onReject={() =>
                handleReject(instantBookingNotification.data.notification_id)
              }
              active={true}
              UserStatus={orderstatus}
              type={"INSTANT"}
              // onComplete={handleComplete}
              // accepted={accepted}
              // onClose={handleCloseCard}
            />

            {/* Map displaying customer location */}
            <div className="w-full border rounded-lg overflow-hidden">
              <MapsCard
                latitude={
                  parseFloat(instantBookingNotification.data.latitude) || 0
                }
                longitude={
                  parseFloat(instantBookingNotification.data.longitude) || 0
                }
              />
            </div>
          </div>
        ) : orderData?.length > 0 ? (
          orderData.map((order) => (
            <div className="flex gap-2 w-full">
              {/* Instant Order Card for fetched orderData */}
              <OrderCard
                title={order?.title}
                description={`Total Price: ₹${order.total_price}`}
                imageUrl={getImgUrl(parseInt(order?.recipe_id))}
                recipeId={order?.recipe_id}
                customerId={order?.customer_id}
                location={order?.location}
                onComplete={() => handleComplete(order.order_id)}
                onCancel={() => handleCancel(order.order_id)}
                active={false}
                UserStatus={orderstatus}
                type={order?.type}
              />
              <div className="w-full border rounded-lg overflow-hidden">
                <MapsCard
                  latitude={parseFloat(order?.latitude) || 0}
                  longitude={parseFloat(order?.longitude) || 0}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center text-gray-500 py-10">
            <h2 className="text-lg">📭 You have no instant orders.</h2>
          </div>
        )}
      </div>
      <h1 className="font-normal text-xl text-gray-500">Today's Orders</h1>

      {todaysOrders.length > 0 ? (
        todaysOrders.map((order) => (
          <div className="flex gap-2 w-full">
            {/* Instant Order Card for fetched orderData */}
            <OrderCard
              imageUrl={getImgUrl(order.recipe_id)}
              title={order?.title}
              description={`Total Price: ₹${order.total_price}`}
              recipeId={order?.recipe_id}
              customerId={order?.customer_id}
              location={order?.location}
              onComplete={() => handleAdvanceComplete(order.order_id)}
              onCancel={() => handleAdvanceCancel(order.order_id)}
              active={false}
              date={new Date(order.start_date_time).toLocaleDateString()}
              startTime={new Date(order.start_date_time).toLocaleTimeString()}
              endTime={new Date(order.end_date_time).toLocaleTimeString()}
              // UserStatus={orderstatus}
              type={order?.type}
            />
            <div className="w-full border rounded-lg overflow-hidden">
              <MapsCard
                latitude={parseFloat(order?.latitude) || 0}
                longitude={parseFloat(order?.longitude) || 0}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="w-full text-center text-gray-500 py-10">
          <h2 className="text-lg">📭 You have no orders for today.</h2>
        </div>
      )}

      <hr className="my-10 border-gray-200" />
      <h1 className="font-normal text-xl text-gray-500 mb-5">Pending orders</h1>

      {pendingOrders.length > 0 ? (
        pendingOrders.map((order) => (
          <div className="flex gap-2 w-full">
            {/* Instant Order Card for fetched orderData */}
            <Button
              onClick={() => handleClashCheck(order.order_id, order.chef_id)}
            >
              check clashes
            </Button>
            <OrderCard
              title={order?.title}
              imageUrl={getImgUrl(order.recipe_id)}
              description={`Total Price: ₹${order.total_price}`}
              recipeId={order?.recipe_id}
              customerId={order?.customer_id}
              location={order?.location}
              onAccept={() => handleAdvanceAccept(order.order_id)}
              onReject={() => handleAdvanceReject(order.order_id)}
              active={true}
              type={order?.type}
              // UserStatus={orderstatus}
              date={new Date(order.start_date_time).toLocaleDateString()}
              startTime={new Date(order.start_date_time).toLocaleTimeString()}
              endTime={new Date(order.end_date_time).toLocaleTimeString()}
            />
            <div className="w-full border rounded-lg overflow-hidden">
              <MapsCard
                latitude={parseFloat(order?.latitude) || 0}
                longitude={parseFloat(order?.longitude) || 0}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="w-full text-center text-gray-500 py-10">
          <h2 className="text-lg">📭 You have no PENDING orders.</h2>
        </div>
      )}

      <h1 className="font-normal text-xl text-gray-500">Order History</h1>
      <Table
        completedOrders={completedOrders}
        completedRecipes={completedRecipes}
      />
    </div>
  );
};

export default ManageChefOrders;

const Table = ({ completedOrders = [], completedRecipes = [] }) => {
  const [customerData, setCustomerData] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    initFlowbite();
  });

  const handleView = async (order) => {
    try {
      const result = await APIService.getCustomerById(order?.customer_id);
      if (result) {
        setCustomerData(result);
      }
      setCurrentOrder(order);
    } catch (error) {
      toast.error("Error fetching order details");
    }
  };

  console.log("customerdata", customerData);

  return (
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg p-2">
      <div class="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900">
        <div>
          <button
            id="dropdownActionButton"
            data-dropdown-toggle="dropdownAction"
            class="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            type="button"
          >
            <span class="sr-only">Action button</span>
            Action
            <svg
              class="w-2.5 h-2.5 ms-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 6"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m1 1 4 4 4-4"
              />
            </svg>
          </button>

          <div
            id="dropdownAction"
            class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600"
          >
            <ul
              class="py-1 text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownActionButton"
            >
              <li>
                <a
                  href="#"
                  class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Show only
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Promote
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Activate account
                </a>
              </li>
            </ul>
            <div class="py-1">
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
              >
                Delete User
              </a>
            </div>
          </div>
        </div>
        <label for="table-search" class="sr-only">
          Search
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg
              class="w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            id="table-search-users"
            class="block pt-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Search"
          />
        </div>
      </div>
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="p-4">
              <div class="flex items-center">
                <input
                  id="checkbox-all-search"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label for="checkbox-all-search" class="sr-only">
                  checkbox
                </label>
              </div>
            </th>
            <th scope="col" class="px-6 py-3">
              #ID
            </th>
            <th scope="col" class="px-6 py-3">
              Recipe
            </th>
            <th scope="col" class="px-6 py-3">
              Date
            </th>
            <th scope="col" class="px-6 py-3">
              Type
            </th>
            <th scope="col" class="px-6 py-3">
              Status
            </th>
            <th scope="col" class="px-6 py-3">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {completedOrders.map((order, index) => {
            // Flatten the completedRecipes array (if it's an array of arrays)
            {
              /* const flattenedRecipes = completedRecipes.flat(); */
            }

            // Find the recipe based on recipe_id
            {
              /* const recipe = flattenedRecipes.find(
              (recipe) => recipe.recipe_id === order.recipe_id
            ); */
            }

            // Log the recipe for debugging
            {
              /* console.log("Recipe:", recipe); */
            }
            return (
              <tr
                key={index}
                class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <td class="w-4 p-4">
                  <div class="flex items-center">
                    <input
                      id="checkbox-table-search-1"
                      type="checkbox"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label for="checkbox-table-search-1" class="sr-only">
                      checkbox
                    </label>
                  </div>
                </td>
                <th
                  scope="row"
                  class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {/* <img class="w-10 h-10 rounded-full" src="/docs/images/people/profile-picture-1.jpg" alt="Jese image"/> */}
                  <div class="ps-3">
                    <div class="text-base font-semibold">{order?.order_id}</div>
                    {/* <div class="font-normal text-gray-500">neil.sims@flowbite.com</div> */}
                  </div>
                </th>
                <td class="px-6 py-4">{order?.title || "No recipe title"}</td>
                <td class="px-6 py-4">
                  {/* {
                    // Combine today's date with the provided time string and format it
                    (() => {
                      const timeString = order?.end_date_time; // Assuming order.end_date_time is in the format "11:55:26.300822"
                      const today = new Date(); // Get today's date

                      // Combine the current date with the time string
                      const dateWithTime = new Date(
                        today.toDateString() + " " + timeString
                      );

                      // Return the formatted date in dd/mm/yyyy format
                      return dateWithTime.toLocaleDateString("en-GB");
                    })()
                  } */}
                  {new Date(order?.order_date).toLocaleString()}
                </td>
                <td class="px-6 py-4">
                  {order.type === "ADVANCE" && (
                    <div className="w-full bg-purple-600 text-white font-light text-sm rounded-lg text-center p-1 px-2">
                      ADVANCE
                    </div>
                  )}
                  {order.type === "INSTANT" && (
                    <div className="w-full bg-green-500 text-white font-light text-sm rounded-lg text-center p-1 px-2">
                      INSTANT
                    </div>
                  )}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div
                      class={`${
                        order.status === "COMPLETED"
                          ? "bg-green-500"
                          : order.status === "CONFIRMED"
                          ? "bg-purple-500"
                          : order.status === "PENDING"
                          ? "bg-yellow-300"
                          : order.status === "CANCELLED"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      } h-2.5 w-2.5 rounded-full me-2`}
                    ></div>{" "}
                    {order?.status}
                    {/* <div class="h-2.5 w-2.5 rounded-full bg-yellow-300 me-2"></div> Pending */}
                    {/* <div class="h-2.5 w-2.5 rounded-full bg-red-500 me-2"></div> Cancelled */}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <a
                    href="#"
                    type="button"
                    data-modal-target="editUserModal"
                    data-modal-show="editUserModal"
                    class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    onClick={() => handleView(order)}
                  >
                    View
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        id="editUserModal"
        tabindex="-1"
        aria-hidden="true"
        class="fixed top-0 left-0 right-0 z-50 items-center justify-center hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full"
      >
        <div class="relative w-full max-w-2xl max-h-full">
          <form class="relative bg-white rounded-lg drop-shadow-2xl dark:bg-gray-700">
            <div class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-600 border-gray-200">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Detailed Info
              </h3>
              <button
                type="button"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-hide="editUserModal"
              >
                <svg
                  class="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span class="sr-only">Close modal</span>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div class="grid grid-cols-6 gap-6">
                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="phone-number"
                    class="block mb-2 text-sm font-medium text-gray-500 dark:text-white"
                  >
                    Order ID
                  </label>
                  {currentOrder?.order_id}
                </div>
                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="address"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Recipe
                  </label>
                  {/* <input
                   value={customerData.address || "N/A"}
                    type="text"
                    name="address"
                    id="address"
                    class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="address"
                    readOnly
                  /> */}
                  <p>{currentOrder?.title || ""}</p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="customer-fullname"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Customer Name
                  </label>
                  <p>{customerData.full_name}</p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Email
                  </label>
                  <p>{customerData.email}</p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Price
                  </label>
                  <p>₹ {currentOrder?.price}</p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Type
                  </label>
                  <p>{currentOrder?.booking_type}</p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Order Placed Date
                  </label>
                  <p>
                    {new Date(currentOrder?.order_date).toLocaleDateString()}
                  </p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    STATUS
                  </label>
                  <div
                    class={`${
                      currentOrder?.status === "COMPLETED"
                        ? "bg-green-500"
                        : currentOrder?.status === "CONFIRMED"
                        ? "bg-purple-500"
                        : currentOrder?.status === "PENDING"
                        ? "bg-yellow-300"
                        : currentOrder?.status === "CANCELLED"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    } h-2.5 w-2.5 rounded-full me-2 inline-block`}
                  ></div>{" "}
                  {currentOrder?.status}
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    Start Date Time
                  </label>
                  <p>
                    {new Date(currentOrder?.start_date_time).toLocaleString()}
                  </p>
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-500  dark:text-white"
                  >
                    End Date Time
                  </label>
                  <p>
                    {new Date(currentOrder?.end_date_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* <div class="flex items-center p-6 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
              <button
                type="submit"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Save all
              </button>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
};
