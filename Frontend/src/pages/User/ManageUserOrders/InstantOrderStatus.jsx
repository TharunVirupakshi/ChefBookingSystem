import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";


const InstantOrderStatus = () => {
  const {chef_id} = useParams()
  const [status,setStatus] = useState('PENDING')
  const [ttl, setTtl] = useState(0)


  useEffect(()=>{

      if(!chef_id) return
        // Initialize SSE for TTL updates
        const eventSource = new EventSource(
      `http://localhost:3000/api/orders/sse/instant-booking/${chef_id}`
      );

      eventSource.onmessage = (event) => {
      const { ttl, expired, trueTtl, status } = JSON.parse(event.data);

      console.log("SSE Status:", status, "Remaining True TTL:", trueTtl);
      if(status === 'ACCEPTED' || status === 'REJECTED'){
        setStatus(status)
        eventSource.close()
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
  },[])

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
      <div className="bg-white flex justify-center items-center w-80 h-80 p-6 rounded-lg shadow-lg text-center">
        {status === "PENDING" && (
          <div className="flex flex-col items-center h-1/2 justify-between">
            <p className="text-yellow-500 mt-4 text-lg">Waiting time: {ttl}s</p>
            <AiOutlineLoading3Quarters className="animate-spin text-yellow-500 text-5xl" />
          </div>
        )}
        {status === "ACCEPTED" && (
          <div className="flex flex-col items-center h-1/2 justify-between">
            <p className="text-green-500 mt-4 text-lg">Order Accepted!</p>
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>
        )}
        {status === "REJECTED" && (
          <div className="flex flex-col items-center h-1/2 justify-between">
          <p className="text-red-500 mt-4 text-lg">Order Rejected!</p>
            <FaTimesCircle className="text-red-500 text-5xl" />
           
          </div>
        )}
      </div>
    </div>
  )
}

export default InstantOrderStatus