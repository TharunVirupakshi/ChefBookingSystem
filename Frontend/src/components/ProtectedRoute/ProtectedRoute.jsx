
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../Firebase/firebase";

 const ProtectedRoute = () => {

  const {user, loading} = useAuth();

  if (loading) {
    return null;
  }
  return user ? <Outlet /> : <Navigate to="/login" replace/>;
};

export default ProtectedRoute
