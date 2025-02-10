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

const UserOrder = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chefData, setChefData] = useState([]);
  const [userId,setUserId] = useState('')
  const [recipeData, setRecipeData] = useState(null); // To store the fetched recipe data
  const location = useLocation();

  const [userGeolocation, setUserGeolocation] = useState({ lat: 0, long: 0 });

  const chef_id = location.state?.chef_id;
  const { id: recipe_id } = useParams();

  useEffect(() => {
  if (!loading && user) {
    console.log("User: ", user);
    const uid = user.uid;
    setUserId(uid);
    console.log('useruid', userId);
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
  console.log('customerid',userId)

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
        setRecipeData(data[0]); // Assuming the response is an array, take the first recipe
        console.log("Recipe data:", data[0]);
      } else {
        console.error("Failed to fetch recipe data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching recipe data:", error.message);
    }
  };

  useEffect(() => {
    const saveLoc = (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        long: pos.coords.longitude,
      };
      console.log("User location: ", loc);

      setUserGeolocation(loc);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(saveLoc, null, {
        enableHighAccuracy: true,
      });
    } else {
      alert("Geolocation is not supported by this browser!");
    }
  }, []);

  useEffect(() => {
    if (chef_id) {
      fetchChefData();
    }
    if (chef_id && recipe_id) {
      fetchRecipeData();
    }
  }, [chef_id, recipe_id]);


  const handleOrderNow = async() => {
  //   if (!chef_id || !recipe_id || !userGeolocation.lat || !userGeolocation.long) {
  //   toast.error("Missing required data. Please try again.");
  //   return;
  // }
  const requestData = {
    chef_id,
    customer_id : auth.currentUser.uid,
    recipe_id,
    latitude:userGeolocation.lat,
    longitude:userGeolocation.long,
  }

  try {
    // const response = await fetch("http://localhost:3000/api/orders/instant",{
    //   method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(requestData),
    // });
    // const result = await response.json();
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
        navigate('/instant-order', { state: { chef_id: requestData.chef_id } });
      } else {
        toast.error(response.message || "Failed to place order.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("An error occurred. Please try again.");
    }
  };


  return (
    // <div className="container mx-auto p-6">
    //   {/* Chef Information */}
    //   <div className="mb-8">
    //     <h2 className="text-2xl font-bold text-gray-700 text-center mb-4">Chef's Details</h2>
    //     {chefData ? (
    //       <div className="space-y-4">
    //         <p className="text-lg font-semibold">
    //           Full Name: <span className="text-gray-600">{chefData.full_name}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Rating: <span className="text-gray-600">{chefData.rating}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Specialty: <span className="text-gray-600">{chefData.specialty}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Years of Experience: <span className="text-gray-600">{chefData.experience_years}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Bio: <span className="text-gray-600">{chefData.bio}</span>
    //         </p>
    //       </div>
    //     ) : (
    //       <p className="text-gray-500">Loading chef data...</p>
    //     )}
    //   </div>

    //   {/* Recipe Information */}
    //   <div className="mb-8">
    //     <h2 className="text-2xl font-bold text-gray-700 text-center mb-4">Recipe Details</h2>
    //     {recipeData ? (
    //       <div className="space-y-4">
    //         <h3 className="text-xl font-semibold text-gray-800">{recipeData.title}</h3>
    //         <p className="text-lg font-semibold">
    //           Description: <span className="text-gray-600">{recipeData.description}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Ingredients: <span className="text-gray-600">{recipeData.ingredients}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Preparation Time: <span className="text-gray-600">{recipeData.preparation_time} minutes</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Vegetarian: <span className="text-gray-600">{recipeData.is_vegetarian ? "Yes" : "No"}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Booking Type: <span className="text-gray-600">{recipeData.booking_type}</span>
    //         </p>
    //         <p className="text-lg font-semibold">
    //           Price: <span className="text-gray-600">${recipeData.price}</span>
    //         </p>
    //       </div>
    //     ) : (
    //       <p className="text-gray-500">Loading recipe data...</p>
    //     )}
    //   </div>

    //   {/* Action Buttons */}
    //   <div className="flex justify-center gap-6">
    //     <button
    //       onClick={handleOrderNow}
    //       className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-300"
    //     >
    //       Order Now
    //     </button>
    //     <button
    //       onClick={handleCancel}
    //       className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-300"
    //     >
    //       Cancel
    //     </button>
    //   </div>
    // </div>s
    <>
    <div className="p-14 w-screen">
      <div className="flex flex-wrap  items-center gap-10">
    
        <div className="flex-2">
          <img src={recipe} alt="recipe image" width={300} height={300} />
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
          <br/>

          <div className="inline-flex items-center gap-3 mt-6">
            <span>Chef's Name :</span>{" "}
            <span className="text-lg font-semibold text-gray-600">
              {chefData?.full_name}
            </span>
          </div>
          <br/>

          <div className="inline-flex items-center gap-3">
            <span>Specialty: </span>{" "}
            <span className="text-lg font-semibold text-gray-600">
            {chefData?.specialty}
            </span>
            </div><br/>

          <div className="inline-flex items-center gap-3">
            <span>Bio: </span>{" "}
            <span className="text-lg font-semibold text-gray-600">
            {chefData?.bio}
            </span>
            </div><br/>

          <div className="inline-flex items-center gap-3">
            <span>Chef's Rating: </span>
            <ChefRating chef={chefData} />
          </div><br/>

         

          <div className="my-3">
          <span className="text-red-600 text-xl font-semibold">Price: ₹{recipeData?.price}</span>
          </div>


          <div className="flex my-10 gap-6">
        <button
          onClick={handleOrderNow}
          className="bg-blue-500 text-white px-6 py-3 w-40 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Order Now
        </button>
          </div>
        </div>
      </div>
      <div className="mt-9">
  <hr className="border-gray-300" />
</div>


      <div className="mt-4 flex flex-col items-start gap-4">
       <span className="text-2xl font-semibold text-slate-600">Ingredients </span>
      <p className="text-sm text-justify">
        {recipeData?.ingredients}
      </p>
      </div>
    </div>
    </>
  );
};

export default UserOrder;
