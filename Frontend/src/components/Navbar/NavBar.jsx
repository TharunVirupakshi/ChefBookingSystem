import React from 'react'

import { Avatar, Dropdown, Navbar } from "flowbite-react";
import userSVG from '../../assets/userAvatar.svg'
import { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const NavBar = ({username, email, handleSignOut = ()=>{} ,isShowAvatar = true,handleDashboard = ()=>{}}) => {

  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const { user, loading } = useAuth()

  useEffect(()=>{
    setIsAvatarVisible(isShowAvatar)
  },[user])

  

  return (
    <Navbar fluid rounded  className='bg-amber-300'>
      <Navbar.Brand href="#">
        {/* <img src="/favicon.svg" className="mr-3 h-6 sm:h-9" alt="Flowbite React Logo" /> */}
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">HireChef</span>
      </Navbar.Brand>


      {/* Avatar */}

      
      <div className={`${!isAvatarVisible && 'hidden'} flex md:order-2`}>
        <Dropdown
          arrowIcon={false}
          inline
          label={
            <Avatar size={'sm'} alt="User settings" img={userSVG} rounded />
          }
        >
          <Dropdown.Header>
            <span className="block text-sm">{username || 'N/A'}</span>
            <span className="block truncate text-sm font-medium">{email}</span>
          </Dropdown.Header>
          <Dropdown.Item onClick={handleDashboard}>Dashboard</Dropdown.Item>
          <Dropdown.Item>Settings</Dropdown.Item>
          <Dropdown.Item>Earnings</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={handleSignOut}>Sign out</Dropdown.Item>
        </Dropdown>
        <Navbar.Toggle />
      </div>


      <Navbar.Collapse>
        <Navbar.Link href="#" active>
          Home
        </Navbar.Link>
        <Navbar.Link href="#">About</Navbar.Link>
        <Navbar.Link href="#">Services</Navbar.Link>
        <Navbar.Link href="#">Pricing</Navbar.Link>
        <Navbar.Link href="#">Contact</Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default NavBar