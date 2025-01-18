import { signOut } from 'firebase/auth'
import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import NavBar from '../components/Navbar/NavBar'
import { useAuth } from '../context/AuthContext'
import { auth } from '../Firebase/firebase'

const MainLayout = () => {

  const {user, loading} = useAuth()  
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut(auth);
    navigate('/login', {replace: true});
 }

 
  
  return (
    <>
    <NavBar username={user?.displayName} email={user?.email} handleSignOut={handleSignOut} />
    <main className=''>
      <Outlet />
    </main>
    </>
  )
}

export default MainLayout