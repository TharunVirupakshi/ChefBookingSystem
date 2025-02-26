import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import recipe from "../../../assets/sandwich.jpg";
import "react-toastify/dist/ReactToastify.css";
import ChefRating from "../../../components/Rating/ChefRating/ChefRating";
import { auth } from "../../../Firebase/firebase";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import APIService from "../../../API/APIService";
import getImgUrl from "../../../utils/images";

const UserOrder = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chefData, setChefData] = useState([]);
  const [userId, setUserId] = useState("");
  const [recipeData, setRecipeData] = useState(null); // To store the fetched recipe data
  const location = useLocation();
  const [recipeType, setRecipeType] = useState("");
  const [userGeolocation, setUserGeolocation] = useState({ lat: 0, long: 0 });

  const chef_id = location.state?.chef_id;
  const { id: recipe_id } = useParams();

  useEffect(() => {
    if (!loading && user) {
      console.log("User: ", user);
      const uid = user.uid;
      setUserId(uid);
      console.log("useruid", userId);
    }
  }, [user, loading]);

  // useEffect(() => {
  //   if (auth.currentUser?.uid) {
  //     const uid=auth.currentUser.uid
  //     setUserUid(uid)
  //   } else {
  //     console.log("No user is currently authenticated.");
  //   }
  // }, []);

  console.log("Recipe ID:", recipe_id);
  console.log("Chef ID:", chef_id);
  console.log("customerid", userId);

  // Fetch Chef Data
  const fetchChefData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/chefs/${chef_id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setChefData(data);
        console.log("Chef's data:", data);
      } else {
        console.error("Failed to fetch chef data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching chef's data:", error.message);
    }
  };

  // Fetch Recipe Data based on chef_id and recipe_id
  const fetchRecipeData = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/recipes/${chef_id}/${recipe_id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRecipeData(data[0]);
        console.log("Recipe data:", data[0]);
        setRecipeType(data[0].booking_type);
        console.log(recipeType);
        console.log("BOOKING TYPE:", data[0].booking_type);
      } else {
        console.error("Failed to fetch recipe data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching recipe data:", error.message);
    }
  };

  // GET USER LOCATION
  // GET USER LOCATION
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3; // Maximum number of retry attempts

    const fetchLocation = () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser!");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          };
          console.log("✅ User location:", loc);
          setUserGeolocation(loc);
        },
        (error) => {
          console.error("❌ Geolocation error:", error.message);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert(
                "You denied the location request. Please enable location services."
              );
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

          if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `🔄 Retrying location fetch (${retryCount}/${maxRetries})...`
            );
            setTimeout(fetchLocation, 3000); // Wait 3 seconds before retrying
          } else {
            alert("Failed to get location after multiple attempts.");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    fetchLocation(); // Initial call
  }, []);

  useEffect(() => {
    if (chef_id) {
      fetchChefData();
    }
    if (chef_id && recipe_id) {
      fetchRecipeData();
    }
  }, [chef_id, recipe_id]);

  const handleOrderNow = async () => {
    const requestData = {
      chef_id,
      customer_id: auth.currentUser.uid,
      recipe_id,
      latitude: userGeolocation.lat,
      longitude: userGeolocation.long,
    };

    try {
      const response = await APIService.instantBooking(
        requestData.chef_id,
        requestData.customer_id,
        requestData.recipe_id,
        requestData.latitude,
        requestData.longitude
      );

      if (response.success) {
        toast.success(response.message || "Booking request sent successfully!");
        console.log("Request ID:", response.req_id);
        console.log("Navigating with chef_id:", requestData.chef_id);
        navigate("/instant-order", { state: { chef_id: requestData.chef_id } });
      } else {
        toast.error(response.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error?.message || "An error occurred. Please try again.");
    }
  };

  const handleAdvancedOrder = () => {
    // console.log("recipe_id, heading to advanced", recipe_id);
    navigate("/advanced-order", { state: { chef_id, recipe_id } });
  };

  const imgUrl = getImgUrl(recipeData?.recipe_id ?? -1);

  return (
    <>
      <div className="p-14 w-screen">
        <div className="flex flex-wrap  items-center gap-10">
          <div className="flex-2 w-72 h-96">
            <img
              src={imgUrl}
              alt="recipe image"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <span className="text-3xl font-semibold text-slate-600">
              {recipeData?.title}
            </span>
            <div className="w-3/4">
              <p className="text-base mt-3 line-clamp-4 text-justify">
                {recipeData?.description}
              </p>
            </div>

            <div className="inline-flex items-center gap-3">
              <span> Preparation Time:</span>{" "}
              <span className="text-lg font-semibold text-gray-600">
                {recipeData?.preparation_time} minutes
              </span>
            </div>
            <br />

            <div className="inline-flex items-center gap-3 mt-6">
              <span>Chef's Name :</span>{" "}
              <span className="text-lg font-semibold text-gray-600">
                {chefData?.full_name}
              </span>
            </div>
            <br />

            <div className="inline-flex items-center gap-3">
              <span>Specialty: </span>{" "}
              <span className="text-lg font-semibold text-gray-600">
                {chefData?.specialty}
              </span>
            </div>
            <br />

            <div className="inline-flex items-center gap-3">
              <span>Bio: </span>{" "}
              <span className="text-lg font-semibold text-gray-600">
                {chefData?.bio}
              </span>
            </div>
            <br />

            <div className="inline-flex items-center gap-3">
              <span>Chef's Rating: </span>
              <ChefRating chef={chefData} />
            </div>
            <br />

            <div className="my-3">
              <span className="text-green-500 text-xl font-semibold">
                Price: ₹{recipeData?.price}
              </span>
            </div>

            <div className="my-10 flex flex-col gap-4">
              {/* Display message when item is not available for instant booking */}
              {recipeType === "advance" && (
                <p className="text-red-500 font-semibold">
                  Item is not available for instant booking. Please choose
                  advanced booking.
                </p>
              )}

              {/* Buttons should be side by side */}
              <div className="flex gap-6">
                {/* Instant Order Button - Disabled when recipeType is "advance" */}
                <button
                  onClick={handleOrderNow}
                  className="px-6 py-3 w-40 rounded-lg text-white transition duration-300 
                 bg-blue-500 hover:bg-blue-600 
                 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={recipeType === "advance"}
                >
                  Order Now
                </button>

                {/* Advanced Booking Button */}
                <button
                  onClick={handleAdvancedOrder}
                  className="px-6 py-3 w-40 rounded-lg text-white transition duration-300 
                 bg-blue-500 hover:bg-blue-600"
                >
                  Advanced Booking
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-9">
          <hr className="border-gray-300" />
        </div>

        <div className="mt-4 flex flex-col items-start gap-4">
          <span className="text-2xl font-semibold text-slate-600">
            Ingredients{" "}
          </span>
          <p className="text-sm text-justify">{recipeData?.ingredients}</p>
        </div>
      </div>
    </>
  );
};

export default UserOrder;
