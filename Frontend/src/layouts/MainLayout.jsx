import { signOut } from 'firebase/auth'
import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import NavBar from '../components/Navbar/NavBar'
import { useAuth } from '../context/AuthContext'
import { auth } from '../Firebase/firebase'

const MainLayout = ({userType}) => {

  const {user, loading} = useAuth()  
  const navigate = useNavigate();

  const handleDashboard = () =>{
   if(userType === 'CHEF'){
    navigate('/dashboard/chef',{replace: true});
   }
   else if(userType === 'ADMIN'){
    navigate('/dashboard/admin',{replace:true});
   }
   else  navigate('/dashboard/user');
  }

  const handleSignOut = () => {
    signOut(auth);
    navigate('/login', {replace: true});
 }

 
  
  return (
    <>
    <NavBar username={user?.displayName} email={user?.email} handleSignOut={handleSignOut} handleDashboard={handleDashboard}/>
    <main className=''>
      <Outlet />
    </main>
    </>
  )
}

export default MainLayout