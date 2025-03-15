import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import APIService from "../../../API/APIService";
import { useAuth } from "../../../context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import GoogleMapComponent from "../../../components/Maps/GoogleMapComponent";

const AdvancedOrderPage = () => {
  const location = useLocation();
  const chef_id = location.state?.chef_id;
  const recipe_id = location.state?.recipe_id;

  const [selectedDate, setSelectedDate] = useState("");
  const [bookedTimes, setBookedTimes] = useState([]); // ✅ Ensure it's an array
  const [selectedTime, setSelectedTime] = useState("");
  const [userId, setUserId] = useState("");
  const { user, loading } = useAuth();
  const [userGeolocation, setUserGeolocation] = useState({ lat: 0, lng: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      console.log("User: ", user);
      const uid = user.uid;
      setUserId(uid);
      console.log("useruid", userId);
      setToCurrentLocation()
    }
  }, [user, loading]);

  

    const fetchLocation = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser!");
    return null;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false, // Reduce precision to improve success rate
        timeout: 15000,            // Extend timeout
        maximumAge: 10000,         // Use cached location if available
      });
    });

    const loc = {
      lat: position.coords.latitude,
      long: position.coords.longitude,
    };

    console.log("✅ User location:", loc);
    return loc;
  } catch (error) {
    console.error("❌ Geolocation error:", error.message);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        alert("You denied the location request. Please enable location services.");
        break;
      case error.POSITION_UNAVAILABLE:
        alert("Location information is unavailable. Retrying...");
        break;
      case error.TIMEOUT:
        alert("The request to get user location timed out. Retrying...");
        break;
      default:
        alert("An unknown error occurred.");
        break;
    }

    toast.error("Unable to fetch location, try again later");
    return null;
  }
};




  const adjustToIST = (utcDateTime) => {
    if (!utcDateTime) return null;

    const date = new Date(utcDateTime); // Convert to Date object
    date.setHours(date.getHours() + 5); // Add 5 hours
    date.setMinutes(date.getMinutes() + 30); // Add 30 minutes

    return date.toISOString().replace("T", " ").slice(0, 19); // Convert to "YYYY-MM-DD HH:MM:SS"
  };

  const getBookedTimes = async () => {
    if (!selectedDate) {
      alert("Please select a date!");
      return;
    }

    try {
      const res = await APIService.fetchBookedDates(chef_id, selectedDate);

      // ✅ Adjust all times to IST
      const adjustedTimes = res?.blockedDates.map((booking) => ({
        ...booking,
        start_date_time: adjustToIST(booking.start_date_time),
        end_date_time: adjustToIST(booking.end_date_time),
      }));

      setBookedTimes(adjustedTimes);
      console.log("Booked times (converted to IST):", adjustedTimes);
    } catch (error) {
      console.error("Failed to fetch booked times:", error.message);
      setBookedTimes([]);
    }
  };

  // Generate time slots from 08:00 AM to 10:00 PM in HH:MM format
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const setToCurrentLocation = async() => {
    try {
      const loc = await fetchLocation();
      if(loc) setUserGeolocation(loc)
    } catch (error) {
      console.log("Unable to fetch location")
    }
  }

  


  const isTimeBlocked = (time) => {
    // Convert selected time to a Date object for easy comparison
    const selectedDateTime = new Date(`2000-01-01T${time}:00`); // Fixed date

    return bookedTimes.some((booking) => {
      const startTime = new Date(booking.start_date_time);
      const endTime = new Date(booking.end_date_time);

      // Ignore date and only compare time
      const startOnly = new Date(
        `2000-01-01T${startTime.toTimeString().slice(0, 5)}:00`
      );
      const endOnly = new Date(
        `2000-01-01T${endTime.toTimeString().slice(0, 5)}:00`
      );

      return selectedDateTime >= startOnly && selectedDateTime < endOnly;
    });
  };

  const availableTimes = generateTimeSlots().filter(
    (time) => !isTimeBlocked(time)
  );

  const convertToTimestampWithoutTimezone = (date, time) => {
    if (!date || !time) return null; // Ensure both date and time are selected

    // Ensure proper formatting: "YYYY-MM-DD HH:MM:SS"
    return `${date} ${time}:00`;
  };

  const confirmAdvancedOrder = async (selectedDate, selectedTime) => {
    const start_date_time = convertToTimestampWithoutTimezone(
      selectedDate,
      selectedTime
    );
    console.log("stdttm", start_date_time);
    try {
      const response = await APIService.bookAdvancedOrder(
        chef_id,
        userId,
        recipe_id,
        userGeolocation.lat,
        userGeolocation.lng,
        start_date_time
      );
      if (response.success) {
        toast.success(response.message || "Booking request sent successfully!");
        console.log("Request ID:", response.req_id);
        navigate("/myorders", { state: { customer_id: userId } });
      } else {
        toast.error(response.data.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error?.response.data.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Select Your Location
        </h2>

        {/* Google Maps Component */}
        <GoogleMapComponent
          defaultLocation={userGeolocation} // Pass default location
          onLocationSelect={(loc) =>
            setUserGeolocation({ lat: loc.lat, lng: loc.lng })
          }
        />

        {/* Show selected location */}
        <p className="mt-3 text-gray-700">
          Selected Location: {userGeolocation.lat}, {userGeolocation.lng}
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Select Date for Booking
        </h2>

        {/* Date input */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded w-full focus:outline-none focus:ring focus:border-blue-400"
          />

          {/* Button to fetch booked times */}
          <button
            onClick={getBookedTimes}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Get Timings
          </button>
        </div>

        {/* Time Picker */}
        {bookedTimes.length >= 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-600">
              Available Timings:
            </h3>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  className={`px-4 py-2 border rounded ${
                    selectedTime === time
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  } hover:bg-blue-300`}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
            {selectedTime && (
              <button
                className="px-6 py-3 w-40 rounded-lg text-white transition duration-300 
                 bg-blue-500 hover:bg-blue-600"
                onClick={() => confirmAdvancedOrder(selectedDate, selectedTime)}
              >
                {" "}
                confirm order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedOrderPage;
