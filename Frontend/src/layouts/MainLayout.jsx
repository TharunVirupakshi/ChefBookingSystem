import { signOut } from 'firebase/auth'
import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import NavBar from '../components/Navbar/NavBar'
import { useAuth } from '../context/AuthContext'
import { auth } from '../Firebase/firebase'

const MainLayout = ({userType ,removePermission, userId}) => {

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

const handleOrders = ()=>{
  if(userType === 'CHEF'){
    navigate('/dashboard/chef/orders')
  }
  else if(userType === 'ADMIN'){
    navigate('/dashboard/admin/orders')
  }
  else navigate('instant-order')
}


  const handleSignOut = () => {
    signOut(auth);
    if (userId) {
      removePermission(userId)
    }
    navigate('/login', {replace: true});
 }

 
  
  return (
    <>
    <NavBar username={user?.displayName} email={user?.email} handleSignOut={handleSignOut} handleDashboard={handleDashboard} handleOrders={handleOrders}/>
    <main className=''>
      <Outlet />
    </main>
    </>
  )
}

export default MainLayout