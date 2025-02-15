// import React from 'react'
// import { useEffect } from 'react'
// import { useState } from 'react'
// import { FaCheckCircle, FaTimesCircle} from "react-icons/fa";
// import { IoClose } from "react-icons/io5";
// import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import APIService from '../../../API/APIService';
// import { useLocation } from 'react-router-dom';
// import { useNotification } from '../../../context/NotificationsContext';
// import RecipeStatusCard from '../../../components/RecipeStatusCard/RecipeStatusCard';
// import useReverseGeocode from '../../../Hooks/useReverseGeocode';

// const InstantOrderStatus = ({customer_id}) => {
//   const location = useLocation();
//   const {notifications} = useNotification();
//   const [status,setStatus] = useState('PENDING')
//   const [latitude, setLatitude] = useState(null);
//   const [longitude, setLongitude] = useState(null);
//   const [latestAcceptedBooking, setLatestAcceptedBooking] = useState(null);
//   const [ttl, setTtl] = useState(0);
//   const [showBackdrop, setShowBackdrop] = useState(true);
//   const [orders,setOrders] = useState([]);
//   const [recipes,setRecipes] = useState([])
//   const [recipeid,setRecipeId] = useState(null);
//   const [showRecipeStatusCard, setShowRecipeStatusCard] = useState(false);
//   const locationName = useReverseGeocode(latitude, longitude);
//   const chef_id = location.state?.chef_id;

// console.log('customerid',customer_id)

//   // useEffect(()=>{
//   //     if(!chef_id) return
//   //       // Initialize SSE for TTL updates

//   //     const eventSource = APIService.listenToInstantBooking(
//   //       chef_id,
//   //       (data) => {
//   //         const { ttl, expired, trueTtl, status } = data;

//   //         console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);

//   //         if (status === "ACCEPTED" || status === "REJECTED") {
//   //           setStatus(status);
//   //           setTimeout(() => setShowRecipeStatusCard(true), DISPLAY_DURATION);
//   //           eventSource.close();
//   //         }

//   //         if (trueTtl > 0) {
//   //           if (!expired) {
//   //             setTtl(ttl);
//   //           } else if(trueTtl === 0)  {
//   //             setTtl(0);
//   //             setStatus("NOT_RESPONDED");
//   //             setShowRecipeStatusCard(true);
//   //             eventSource.close();
//   //           }
//   //         } else {
//   //           console.log("True TTL reached 0. Closing SSE.");
//   //           eventSource.close();
//   //         }
//   //       },
//   //       (error) => {
//   //         console.error("SSE Error:", error);
//   //       }
//   //     );

//   //     return () => {
//   //       eventSource.close();
//   //     };
//   //   },[])

//   useEffect(() => {
//     if (!chef_id) return;

//     // Initialize SSE for TTL updates
//     const eventSource = APIService.listenToInstantBooking(
//       chef_id,
//       (data) => {
//         const { ttl, expired, trueTtl, status } = data;

//         console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);

//         if (status === "ACCEPTED" || status === "REJECTED") {
//           setStatus(status);
//           eventSource.close();
//         }

//         if (trueTtl > 0) {
//           if (!expired) {
//             setTtl(ttl);
//           }
//         } else {
//           console.log("True TTL reached 0. Displaying Not Responded.");
//           setTtl(0);
//           eventSource.close();
//           setStatus("NOT_RESPONDED");

//         }
//       },
//       (error) => {
//         console.error("SSE Error:", error);
//       }
//     );

//     return () => {
//       eventSource.close();
//     };
//   }, []);

//     useEffect(() => {
//       const latestAccepted = notifications
//         .filter(
//           (notif) =>
//             notif.type &&
//             // notif.type.toUpperCase() === "INSTANT_BOOKING_ACCEPTED" &&
//             notif.data?.notification_id
//         )
//         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]; // Get the most recent one

//       if (latestAccepted) {
//         setLatestAcceptedBooking(latestAccepted);
//         setLatitude(latestAccepted.data.chef_latitude);
//         setLongitude(latestAccepted.data.chef_longitude);
//         setRecipeId(latestAccepted.data.recipe_id);
//         // setChefId(latestAccepted.)
//         console.log("📩 Latest Accepted Instant Booking:", latestAcceptedBooking);
//       }
//     }, [notifications]);

//     //     const eventSource = new EventSource(
//     //   `http://localhost:3000/api/orders/sse/instant-booking/${chef_id}`
//     //   );

//     //   eventSource.onmessage = (event) => {
//     //   const { ttl, expired, trueTtl, status } = JSON.parse(event.data);

//     //   console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);
//     //   if(status === 'ACCEPTED' || status === 'REJECTED'){
//     //     setStatus(status)
//     //     eventSource.close()
//     //   }

//     //   // Keep logging until trueTtl reaches 0
//     //   if (trueTtl > 0) {
//     //     // Update TTL in state if not fully expired
//     //     if (!expired) {
//     //       setTtl(ttl);
//     //     } else {
//     //       setTtl(0); // Display 0 for the visible timer
//     //     }
//     //   } else {
//     //     // Once trueTtl is 0, stop logging and clear notification
//     //     console.log("True TTL reached 0. Closing SSE.");
//     //     eventSource.close(); // Close the SSE stream
//     //   }
//     // };

//     // eventSource.onerror = (err) => {
//     //   console.error("SSE Error:", err);
//     //   eventSource.close(); // Ensure SSE is closed on error
//     // };

//     // Cleanup on component unmount

//   // console.log('latest accepted booking',latestAcceptedBooking)
//   console.log('status',status)
//  console.log('cheflocation',locationName)
// //  console.log('chefid',chef_id)

//  const closePopup = () => {
//   setShowBackdrop(false);

// };

//   return (
//     <>
//     {showBackdrop ? (
//       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-md z-50">
//         <div className="relative bg-white flex flex-col justify-center items-center w-80 h-80 p-6 rounded-lg shadow-lg text-center">
//         <button onClick={closePopup} className='absolute top-6 right-6'>
//         <IoClose  className='text-3xl text-gray-400 hover:text-gray-600'/>
//         </button>
//         {status === "PENDING" &&(
//             <div className="flex flex-col items-center h-1/2 justify-between">

//               <p className="text-yellow-500 mt-4 text-lg">Waiting time: {ttl}s</p>
//               <AiOutlineLoading3Quarters className="animate-spin text-yellow-500 text-5xl" />
//             </div>
//           )}
//           {status === "ACCEPTED" && (
//             <div className="flex flex-col items-center h-1/2 justify-between">
//               <p className="text-green-500 mt-4 text-lg">Order Accepted!</p>
//               <FaCheckCircle className="text-green-500 text-5xl" />
//             </div>
//           )}
//           {status === "REJECTED" && (
//             <div className="flex flex-col items-center h-1/2 justify-between">
//               <p className="text-red-500 mt-4 text-lg">Order Rejected!</p>
//               <FaTimesCircle className="text-red-500 text-5xl" />
//             </div>
//           )}
//           {status === "NOT_RESPONDED" && (
//             <div className="flex flex-col items-center h-1/2 justify-between">
//               <p className="text-orange-500 mt-4 text-lg">Not Responded!</p>
//               <FaTimesCircle className="text-red-500 text-5xl" />
//             </div>
//           )}
//         </div>
//       </div>
//     ) : null }

//      { showRecipeStatusCard ? (

//         <div className="py-5 p-20 gap-2">
//         <h1 className="font-semibold text-xl py-2 text-gray-500">Active Order</h1>
//           <div className="flex gap-2 w-full">
//         <RecipeStatusCard
//           Statustitle={
//             status === "ACCEPTED"
//               ? "Booked"
//               : status === "REJECTED"
//               ? "Rejected"
//               : "Not Responded"
//           }
//           locationName={locationName}
//           title={latestAcceptedBooking.data.recipe_title}

//         />
//          <div className="w-full border rounded-lg overflow-hidden">
//               {/* <MapsCard
//                 latitude={parseFloat(instantBookingNotification.data.latitude) || 12.9716}
//                 longitude={parseFloat(instantBookingNotification.data.longitude) || 77.5946}
//               /> */}
//             </div>
//         </div>
//         </div>
//       ) : (
//         <div className="w-full text-center text-gray-500 py-10">
//             <h2 className="text-lg">📭 You have no orders.</h2>
//           </div>
//       )
//     }
//     <h1 className="font-normal text-xl text-gray-500">Order History</h1>
//       <Table
//         customerOrders={orders}
//         customerRecipes={recipes}
//       />
//   </>
//   )
// }

// export default InstantOrderStatus;

import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaArrowLeft } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import APIService from "../../../API/APIService";

const InstantOrderStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("PENDING");
  const [ttl, setTtl] = useState(0);
  const chef_id = location.state?.chef_id;





  const handleCancelBooking = async () => {
    try {
      await APIService.cancelInstantBooking(chef_id);
      console.log("Booking cancelled successfully");
  
      // Navigate back after successful cancellation
      navigate(-1);
    } catch (error) {
      console.error("Cancel failed:", error.message);
    }
  };
  
  


  useEffect(() => {
    if (!chef_id) return;
    // Initialize SSE for TTL updates
    const eventSource = new EventSource(
      `http://localhost:3000/api/orders/sse/instant-booking/${chef_id}`
    );

    eventSource.onmessage = (event) => {
      const { ttl, expired, trueTtl, status } = JSON.parse(event.data);

      console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);
      if (status === "ACCEPTED" || status === "REJECTED") {
        setStatus(status);
        eventSource.close();
      }

      // Keep logging until trueTtl reaches 0
      if (trueTtl > 0) {
        // Update TTL in state if not fully expired
        if (!expired) {
          setTtl(ttl);
        } else {
          setTtl(0); // Display 0 for the visible timer
          
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
  }, []);

  // Function to render buttons based on status
  const renderActionButton = () => {
    if (status === "ACCEPTED") {
      return (
        <button
          className="text-blue-700 underline px-4 py-2 rounded-md"
          onClick={() =>
            navigate("/myorders", { state: { status } }, { replace: true })
          }
        >
          View Orders
        </button>
      );
    } else if (status === "REJECTED" || ttl === 0) {
      return (
        <button
          className="text-gray-600"
          onClick={() => navigate(-1, { replace: true })}
        >
          Go Back
        </button>
      );
    } else if (status === "PENDING") {
      return (
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md"
          onClick={handleCancelBooking}
        >
          Cancel
        </button>
      );
    }
    return null;
  };

  // const closePopup = () => {
  //   navigate('/myorders', { state: { status } }, { replace: true });
  // };

  return (
    // <div>
    //   {
    //     status
    //   }
    //   <div className="">
    //   {
    //    status === 'PENDING' && (<p>Waiting time: {ttl}s </p>)
    //   }

    //   </div>
    // </div>

    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-md z-50">
      <div className="relative bg-white flex flex-col justify-center items-center w-80 h-80 p-6 rounded-lg shadow-lg text-center">
        {/* <button onClick={closePopup} className='absolute top-6 right-6'>
         <IoClose  className='text-3xl text-gray-400 hover:text-gray-600'/>
         </button> */}
        {status === "PENDING" && ttl > 0 && (
          <div className="flex flex-col items-center h-1/2 justify-center gap-6">
            <p className="text-yellow-500 text-lg">Waiting time: {ttl}s</p>
            <AiOutlineLoading3Quarters className="animate-spin text-yellow-500 text-5xl" />
          </div>
        )}
        {status === "PENDING" && ttl === 0 && (
          <div className="flex flex-col items-center h-1/2 justify-center gap-6">
            <p className="text-red-500 text-lg">Timed out!</p>
            <FaTimesCircle className="text-red-500 text-5xl" />
          </div>
        )}
        {status === "ACCEPTED" && (
          <div className="flex flex-col items-center h-1/2 justify-center gap-6">
            <p className="text-green-500 text-lg">Order Accepted!</p>
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
        )}
        {status === "REJECTED" && (
          <div className="flex flex-col items-center h-1/2 justify-center gap-6">
            <p className="text-red-500 text-lg">Order Rejected!</p>
            <FaTimesCircle className="text-red-500 text-5xl" />
          </div>
        )}
        <div className="bottom-7 absolute">{renderActionButton()}</div>
      </div>
    </div>
  );
};

export default InstantOrderStatus;
