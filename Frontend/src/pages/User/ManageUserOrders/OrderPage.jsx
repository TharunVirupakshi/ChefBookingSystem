import React, { useEffect, useState } from 'react'
import { useNotification } from '../../../context/NotificationsContext';
import APIService from '../../../API/APIService';
import { useLocation } from 'react-router-dom';
import useReverseGeocode from '../../../Hooks/useReverseGeocode';
import RecipeStatusCard from '../../../components/RecipeStatusCard/RecipeStatusCard';
import { initFlowbite } from 'flowbite';

function OrderPage({customer_id}) {
  const {notifications} = useNotification();
  const location = useLocation();
  const [orders,setOrders] = useState([]);
  const [status, setStatus] = useState("Not Responded");
  const [recipes,setRecipes] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);  
  const [recipeid,setRecipeId] = useState(null);
  const [latestAcceptedBooking, setLatestAcceptedBooking] = useState(null);
  const locationName = useReverseGeocode(latitude, longitude);


  console.log('customerid in orderpage',customer_id)

  useEffect(() => {
    if (location.state?.status) {
      setStatus(location.state.status);
    }
  }, [location.state?.status]);

  useEffect(()=>{
    initFlowbite();
  },[])

  useEffect(() => {
    const latestAccepted = notifications
      .filter(
        (notif) =>
          notif.type &&
          // notif.type.toUpperCase() === "INSTANT_BOOKING_ACCEPTED" &&
          notif.data?.notification_id
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]; // Get the most recent one

    if (latestAccepted) {
      console.log('latestAccepted',latestAccepted)
      setLatestAcceptedBooking(latestAccepted);
      setLatitude(latestAccepted.data.chef_latitude);
      setLongitude(latestAccepted.data.chef_longitude);
      setRecipeId(latestAccepted.data.recipe_id);
      // setChefId(latestAccepted.)
      console.log("📩 Latest Accepted Instant Booking:", latestAcceptedBooking);
    }
  }, [notifications]);

  
useEffect(() => {
  const fetchPastOrdersAndRecipes = async () => {
    try {
      // Fetch completed orders using APIService
      const orders = await APIService.fetchCustomerOrders(customer_id);
      // console.log('order',orders)
      setOrders(orders);

      if (orders.length === 0) return;

      //Fetch recipes for each order
      const recipePromises = orders.map((order) =>
        APIService.fetchRecipesByRecipeId(order.recipe_id)
      );

      const recipes = await Promise.all(recipePromises);
      // console.log("Fetched Recipes:", recipes); // Debugging log
      setRecipes(recipes);
    } catch (error) {
      console.error("Error fetching completed orders and recipes:", error);
    }
  };

 
    fetchPastOrdersAndRecipes();
}, [customer_id]);
//   console.log("completed orders..", orders);
//   console.log("completed recipes..", recipes);
// console.log('latest accepted booking',latestAcceptedBooking)








  return (
    <div>
         {orders && recipes.length > 0 ?  (
         
        <div className="py-5 p-20 gap-2">
        <h1 className="font-semibold text-xl py-2 text-gray-500">Active Order</h1>
          <div className="flex gap-2 w-full">
        <RecipeStatusCard
          Statustitle={
            status === "ACCEPTED"
              ? "Booked"
              : status === "REJECTED"
              ? "Rejected"
              : "Cancelled"
          }
          locationName={locationName}
          title={recipes.recipe_title}

        />
         <div className="w-full border rounded-lg overflow-hidden">
              {/* <MapsCard
                latitude={parseFloat(instantBookingNotification.data.latitude) || 12.9716}
                longitude={parseFloat(instantBookingNotification.data.longitude) || 77.5946}
              /> */}
            </div>
        </div>

       
        </div>
      ) : (
        <div className="w-full text-center text-gray-500 py-10">
            <h2 className="text-lg">📭 You have no orders.</h2>
          </div>
      )
    }
    <h1 className="font-normal text-xl text-gray-500">Order History</h1>
        <Table
        customerOrders={orders}
        customerRecipes={recipes}
      />
      </div>
  )
}

export default OrderPage








const Table = ({ customerOrders = [], customerRecipes = [] }) => {
  const [chefData,setChefData] = useState([])

const handleDataView = async (chefId) =>{
  if (!chefId) return;
  const result = await APIService.fetchChefById(chefId);
  if (result){
    setChefData(result)
  }
}


console.log('chefData',chefData)
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
                  Reward
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
            placeholder="Search for users"
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
          {customerOrders.map((order, index) => {
            // Flatten the completedRecipes array (if it's an array of arrays)
            const flattenedRecipes = customerRecipes.flat();

            // Find the recipe based on recipe_id
            const recipe = flattenedRecipes.find(
              (recipe) => recipe.recipe_id === order.recipe_id
            );

            // Log the recipe for debugging
            {/* console.log("Recipe:", recipe); */}
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
                    <div class="text-base font-semibold">{order.order_id}</div>
                    {/* <div class="font-normal text-gray-500">neil.sims@flowbite.com</div> */}
                  </div>
                </th>
                <td class="px-6 py-4">{recipe?.title || "No recipe title"}</td>
                <td class="px-6 py-4">
                  {
                    // Combine today's date with the provided time string and format it
                    (() => {
                      const timeString = order.end_date_time; // Assuming order.end_date_time is in the format "11:55:26.300822"
                      const today = new Date(); // Get today's date

                      // Combine the current date with the time string
                      const dateWithTime = new Date(
                        today.toDateString() + " " + timeString
                      );

                      // Return the formatted date in dd/mm/yyyy format
                      return dateWithTime.toLocaleDateString("en-GB");
                    })()
                  }
                </td>
                <td class="px-6 py-4">{order.type}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class={`${order.status === "COMPLETED" ?  "bg-green-500" : "bg-red-500"} h-2.5 w-2.5 rounded-full me-2`}></div>{" "}
                    {order.status}
                    {/* <div class="h-2.5 w-2.5 rounded-full bg-yellow-300 me-2"></div> Pending */}
                    {/* <div class="h-2.5 w-2.5 rounded-full bg-red-500 me-2"></div> Cancelled */}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <a
                    href="#"
                    onClick={()=>handleDataView(order.chef_id)}
                    type="button"
                    data-modal-target="editUserModal"
                    data-modal-show="editUserModal"
                    class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
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
          <form class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
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
                    for="Chef-fullname"
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Chef FullName
                  </label>
                  <input
                    type="text"
                    name="first-name"
                    id="first-name"
                    value={chefData.full_name || ""}
                    class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Bonnie"
                    readOnly
                  />
                </div>
               
               
                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="email"
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Email
                  </label>
                  <input
                  value={chefData.email || ""}
                    type="email"
                    name="email"
                    id="email"
                    class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="example@company.com"
                    readOnly
                  />
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="phone-number"
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Phone Number
                  </label>
                  <input
                   value={chefData.phone_number || "N/A"}
                    type="text"
                    name="phone-number"
                    id="phone-number"
                    class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   readOnly
                  />
                </div>
                <div class="col-span-6 sm:col-span-3">
                  <label
                    for="bio"
                    class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                  Bio
                  </label>
                  <input
                   value={chefData.bio || "N/A"}
                    type="text"
                    name="bio"
                    id="bio"
                    class="shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    readOnly
                  />
                </div>
                
              </div>
            </div>

            <div class="flex items-center p-6 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
              <button
                type="submit"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Save all
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
