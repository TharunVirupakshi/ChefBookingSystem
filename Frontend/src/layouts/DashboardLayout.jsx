import React from 'react'
import { Outlet } from 'react-router-dom';
import SideNavbar from '../components/SideNavbar/SideNavbar';
import chefData from '../pages/Chef/ChefData.json'


const DashboardLayout = ({userType}) => {


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
console.log('chefdata',chefData)

        let sidebarLinks;
        switch (userType) {
          case "CHEF":
            sidebarLinks = chefData;
            break;
          case "ADMIN":
            sidebarLinks = adminData;
            break;
          case "USER":
            sidebarLinks = userData;
            break;
          default:
            sidebarLinks = [];
        }
      



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