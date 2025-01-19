
import React from 'react'
import { Card, Dropdown } from "flowbite-react";
import recipe from '../../../src/assets/sandwich.jpg'


const InstantOrderCard = ({ location, imageUrl, title, onAccept = ()=>{}, onReject = ()=>{} }) => {
  return (
    <>
      <Card className="max-w-lg p-5">
        {/* <div className="flex justify-end">
        <Dropdown inline label="">
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Edit
            </a>
          </Dropdown.Item>
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Export Data
            </a>
          </Dropdown.Item>
          <Dropdown.Item>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Delete
            </a>
          </Dropdown.Item>
        </Dropdown>
      </div> */}
        <div className="flex flex-col items-center">
          <img
            alt="Bonnie image"
            src={recipe}
            className="mb-3 rounded-full aspect-square w-40 shadow-lg"
          />
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
          <div className="mt-4 flex space-x-3 lg:mt-6">
            <div 
              className="cursor-pointer inline-flex items-center rounded-lg bg-amber-300 px-4 py-2 text-center text-sm font-medium text-secondary hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800"
              onClick={onAccept}
            >
              Accept
            </div>
            <div
              onClick={onReject}
              className="cursor-pointer inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              Reject
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export default InstantOrderCard