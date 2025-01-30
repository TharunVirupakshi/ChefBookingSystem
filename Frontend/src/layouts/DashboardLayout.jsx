import React from 'react'
import { Outlet } from 'react-router-dom';
import SideNavbar from '../components/SideNavbar/SideNavbar';
import chefData from '../pages/Chef/ChefData.json'
import adminData from '../pages/Admin/AdminData.json'

import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const DashboardLayout = ({userType}) => {
  const navigate = useNavigate();
const [sidebarLinks,setSidebarLinks] = useState([])

    /*
        Admin routes:
        - Manage orders
        - Manage customers
        - Manage chefs
        - Manage recipes 

        Chef routes:
        - Overview (to show instant order notifications, current order) (have a button to toggle active status)
        - My orders
    */ 
// console.log('chefdata',chefData)


const handleSidebarLinks = () =>{
  switch (userType) {
    case "CHEF":
     setSidebarLinks(chefData);
      break;
    case "ADMIN":
     setSidebarLinks(adminData);
      break;
    case "USER":
    navigate('/',{replace:true})  
      break;
    default:
      setSidebarLinks([]);
  }
}
       
     useEffect(()=>{
        handleSidebarLinks()
     },[userType,sidebarLinks]) 

   
    //  console.log('sidebarLinks...',sidebarLinks)

  return (
    <div className="md:flex bg-gray-200 h-screen overflow-hidden">
    <SideNavbar links={sidebarLinks}/> 
    <div className="p-3  rounded-lg w-full overflow-scroll h-screen">
        <Outlet/>
    </div>
    </div>
  )
}

export default DashboardLayout