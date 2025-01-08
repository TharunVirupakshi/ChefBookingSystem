import { Outlet } from "react-router-dom";
import NavBar from "../components/Navbar/NavBar";


const AuthLayout = () => {
  return (
    <>
      <NavBar isShowAvatar={false}/>
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default AuthLayout;
