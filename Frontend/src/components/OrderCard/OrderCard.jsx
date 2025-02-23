
import React, { useEffect } from 'react'
import { Card, Dropdown } from "flowbite-react";
import recipe from '../../../src/assets/sandwich.jpg'
import getImgUrl from '../../utils/images';


const OrderCard = ({ active,timeRemaining, location, imageUrl, title, onAccept = ()=>{}, onReject = ()=>{}, onComplete=()=>{}, onCancel=()=>{},UserStatus, startTime, endTime,date, type}) => {
 console.log('active',active)
 const isCancelled = UserStatus === "CANCELLED";

  return (
    <>
      <Card className="max-w-lg p-2">
      {type === 'ADVANCE' && (
        <div className='bg-purple-600 text-white font-light text-sm rounded-lg text-center w-fit p-1 px-2'>ADVANCE</div>
      )}
      {type === 'INSTANT' && (
        <div className='bg-green-500 text-white font-light text-sm rounded-lg text-center w-fit p-1 px-2'>INSTANT</div>
      )}
      <span className={`${isCancelled ? "text-red-500" : "text-green-500"}`}>
      {isCancelled && "User Cancelled"}
        </span>
        <div className="flex flex-col items-center">

          <div className='w-40 aspect-square rounded-full overflow-hidden'>
            <img
              alt="Bonnie image"
              src={imageUrl ?? ""}
              className="w-full object-cover"
            />
          </div>
          
          <div className='text-center w-[250px]'>
          <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
            {title}
          </h5>
         
            <span className="text-sm text-gray-500 dark:text-gray-400">
          <svg
              className="w-6 h-6 text-gray-800 dark:text-white inline"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="evenodd"
                d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z"
                clip-rule="evenodd"
              />
            </svg>
            <br></br>
            {location}
          </span>
          </div>
          <div className='text-center'>
          <p>{date}</p>
          <p>{startTime} - {endTime}</p>
          </div>
          <div className="mt-4 flex space-x-3 lg:mt-6">
          {active ? (
            <>
              {/* Show Accept and Reject buttons when active is true */}
              <div 
                  className={`cursor-pointer inline-flex items-center rounded-lg px-4 py-2 text-center text-sm font-medium 
                    ${isCancelled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-amber-300 text-secondary hover:bg-yellow-300 focus:ring-cyan-300"}`}
                  onClick={!isCancelled ? onAccept : undefined}
                >
                  Accept
                </div>

                {/* Reject Button - Disabled when UserStatus is CANCELLED */}
                <div
                  className={`cursor-pointer inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium 
                    ${isCancelled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 hover:bg-gray-100 focus:ring-gray-200"}`}
                  onClick={!isCancelled ? onReject : undefined}
                >
                  Reject
                </div>
            </>
          ) : (
            <>
              {/* Show Complete and Cancel buttons when active is false */}
              <div 
                className="cursor-pointer inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300"
                onClick={onComplete}
              >
                Complete
              </div>
              <div
                className="cursor-pointer inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                onClick={onCancel}
              >
                Cancel
              </div>
            </>
          )}
        </div>
          {timeRemaining && (
          <div className="text-sm mt-4 text-red-500">
            Time Remaining: {timeRemaining}s
         </div>
         )}
        </div>
      </Card>
    </>
  );
}

export default OrderCard