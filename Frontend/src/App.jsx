import './App.css'
import {onAuthStateChanged, signOut} from 'firebase/auth'
import {Route,Routes, useLocation, useNavigate} from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import NavBar from './components/Navbar/NavBar'
import { useEffect, useState, useMemo } from 'react'
import SignUpPage from './pages/SignUpPage/SignUpPage'
import HomePage from './pages/HomePage'
import {auth} from './Firebase/firebase'
import { useAuth } from './context/AuthContext'
import ProfilePage from './pages/ProfilePage/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'



function App() {
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [curUser, setCurUser] = useState(null);

  const {user, loading} = useAuth();

  useEffect(() => {
    if(!loading){
      console.log("User: ", user);
      // setCurUser(user);
    }
    
  }, [user, loading]);

  const curUser = useMemo(() => user, [user]); // Memoize user data
  const isLoggedIn = useMemo(() => !!user, [user]); // Avoid re-computation

 


  

  return (
    <div>
      <Routes>

        {/* Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App
