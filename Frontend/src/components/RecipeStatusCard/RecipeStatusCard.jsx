import React, { useEffect } from "react";
import { Card, Dropdown } from "flowbite-react";
import recipe from "../../../src/assets/sandwich.jpg";

const RecipeStatusCard = ({ Statustitle, locationName, title, type, startDateTime, chefName}) => {
  return (
    <>
      <Card className="max-w-lg p-2">


      {type === 'ADVANCE' && (
        <div className='bg-purple-600 text-white font-light text-sm rounded-lg text-center w-fit p-1 px-2'>ADVANCE</div>
      )}
      {type === 'INSTANT' && (
        <div className='bg-green-500 text-white font-light text-sm rounded-lg text-center w-fit p-1 px-2'>INSTANT</div>
      )}
        <span
          className={`${
            Statustitle === "Rejected"
              ? "text-red-500"
              : Statustitle === "Not Responded"
              ? "text-orange-500"
              : "text-green-500"
          }`}
        >
          {Statustitle}
        </span>

        <div className="flex flex-col items-center">
          <img
            alt="Bonnie image"
            src={recipe}
            className="mb-3 rounded-full aspect-square w-40 shadow-lg"
          />

          <div className="text-center w-[250px]">
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

              {startDateTime}
            </span>
            <p>Chef {chefName}</p>
          </div>
          <div className="mt-4 flex space-x-3 lg:mt-6"></div>
        </div>
      </Card>
    </>
  );
};

export default RecipeStatusCard;
