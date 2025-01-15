import React from 'react'
import InstantOderCard from '../../components/InstantOrderCard/InstantOderCard'
import './ChefDashboard.css'

const ChefDashboard = () => {
  return (
    <div className="bg-slate-100 p-10 rounded-md shadow-md h-screen">
      <h1 className=" font-normal text-xl text-gray-500 underline underline-offset-4">
        Overview
      </h1>


      <div className='py-5'>
        <InstantOderCard />
      </div>
    </div>
  );
}

export default ChefDashboard