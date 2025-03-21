import "./App.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import NavBar from "./components/Navbar/NavBar";
import { useEffect, useState, useMemo } from "react";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import HomePage from "./pages/HomePage";
import { auth } from "./Firebase/firebase";
import { useAuth } from "./context/AuthContext";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import ChefLoginPage from "./pages/ChefLoginPage/ChefLoginPage";
import ChefSignUpPage from "./pages/ChefSignUpPage/ChefSignUpPage";

import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import ManageRecipes from "./pages/Admin/ManageRecipes/ManageRecipes";
import ManageCustomers from "./pages/Admin/ManageCustomers/ManageCustomers";
import ManageOrders from "./pages/Admin/ManageOrders/ManageOrders";
import { initFlowbite } from "flowbite";
import { useNotification } from "./context/NotificationsContext";
import ManageChefRecipes from "./pages/Chef/ManageChefRecipes/ManageChefRecipes";
import ManageChefOrders from "./pages/Chef/ManageChefOrders/ManageChefOrders";
import ChefDashboard from "./pages/Chef/ChefDashboard/ChefDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserOrder from "./pages/User/ManageUserOrders/UserOrder";
import OrderPage from "./pages/User/ManageUserOrders/OrderPage";
import InstantOrderStatus from "./pages/User/ManageUserOrders/InstantOrderStatus";
import AdvancedOrderPage from "./pages/User/ManageUserOrders/AdvancedOrderPage";
import ManageChefLocation from "./pages/Chef/ManageChefLocation/ManageChefLocation";
import Dashboard from "./pages/Admin/AdminDashboard/Dashboard";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";

function App() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState("");

  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [curUser, setCurUser] = useState(null);

  const { user, loading, getUserType, logout } = useAuth();
  const { requestPermission, removePermission } = useNotification();

  useEffect(() => {
    initFlowbite();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      console.log("User: ", user);
      const uid = user.uid;
      setUserId(uid);
      console.log("useruid", userId);
      requestPermission(uid);
    }
  }, [user, loading, requestPermission]);

  const curUser = useMemo(() => user, [user]); // Memoize user data
  const isLoggedIn = useMemo(() => !!user, [user]); // Avoid re-computation

  // useEffect(() => {
  //   console.log("Requesting notif permission")

  //     requestPermission(auth.currentUser.uid);

  // }, []);

  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        const type = await getUserType();
        setUserType(type);
      } else {
        setUserType(null);
      }
    };

    fetchUserType();
  }, [user, getUserType]);

  return (
    <>
      <div>
        <ToastContainer />
        <Routes>
          {/* Main Layout */}
          <Route
            element={
              <MainLayout
                userType={userType}
                removePermission={removePermission}
                userId={userId}
              />
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="recipe/:id" element={<UserOrder />} />
            <Route
              path="instant-order"
              element={<InstantOrderStatus customer_id={userId} />}
            />
            <Route
              path="myorders"
              element={<OrderPage customer_id={userId} />}
            />
            <Route path="advanced-order" element={<AdvancedOrderPage />} />

            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={<DashboardLayout userType={userType} />}
              >
                <Route path="chef" element={<ChefDashboard />}>
                  <Route index element={<Navigate to="orders" replace />} />
                  <Route
                    path="orders"
                    element={<ManageChefOrders chef_id={userId} />}
                  />
                  <Route path="recipe" element={<ManageChefRecipes />} />
                </Route>
                <Route path="admin" element={<AdminDashboard />}>
                  <Route index element={<Navigate to="insights" replace />} />
                  <Route path="insights" element={<Dashboard />} />
                  <Route path="recipe" element={<ManageRecipes />} />
                  <Route path="customers" element={<ManageCustomers />} />
                  <Route path="orders" element={<ManageOrders />} />
                </Route>
              </Route>
            </Route>

            <Route
              index
              path="/dashboard"
              element={
                userType === "CHEF" ? (
                  <Navigate to="/dashboard/chef" replace />
                ) : userType === "ADMIN" ? (
                  <Navigate to="/dashboard/admin" replace />
                ) : userType === "USER" ? (
                  <HomePage />
                ) : null
              }
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/cheflogin" element={<ChefLoginPage />} />
            <Route path="/chefsignup" element={<ChefSignUpPage />} />
          </Route>
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;
