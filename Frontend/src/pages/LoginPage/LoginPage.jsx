
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Firebase/firebase";
import { Formik, Field, Form } from "formik";
import { useState, useEffect } from "react";
import Toast from "../../components/Toast/Toast";
import {Link,useNavigate} from 'react-router-dom'
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
    const navigate = useNavigate();
    const [toast, setToast] = useState({ type: "", message: "" });
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null); // Store the timeout ID 
    const { checkUserType } = useAuth()





    const showToast = (type, message) => {
        setToast({ type, message });
        setIsToastVisible(true);
        // Auto-hide the toast after a few seconds
        // Clear any existing timeout to prevent multiple timeouts
        if (timeoutId) {
        clearTimeout(timeoutId);
        }
       // Set a new timeout
        const newTimeoutId = setTimeout(() => {
        setIsToastVisible(false);
        setToast({ type: "", message: "" });
        }, 10000);

        setTimeoutId(newTimeoutId);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        };
    }, [timeoutId]);
    

  const handleSubmit = (values, { setSubmitting }) => {
    // Firebase authentication
    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(async(userCredential) => {
        const user = userCredential.user;
        
        const token = await user.getIdTokenResult()
        
        if(token.claims.chef){
          alert('This is a chef account, login via "/cheflogin" page');
          navigate('/cheflogin', {replace: true})
          return
        }
        

        navigate("/dashboard", { replace: true });
        console.log("User signed in:", user);
        showToast("success", "Login successful!");
       
      })
      .catch((error) => {
        console.error("Authentication error:", error.message);
        showToast("error", `Error: ${error.message}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const initialValues = {
    email: "",
    password: "",
  };

  return (
    <section className="flex items-center justify-center min-h-screen">
      {isToastVisible && 
        <Toast type={toast.type} message={toast.message} onClose={()=> setIsToastVisible(false)}/>
      }
      <div className="w-full flex flex-col max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <h5 className="text-xl font-medium text-gray-900 dark:text-white">
                Sign in to our platform
              </h5>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Your email
                </label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Your password
                </label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {isSubmitting ? "Signing in..." : "Login to your account"}
              </button>

              {/* Register Link */}
              <div className="text-xs font-normal text-gray-500 dark:text-gray-300">
                Not registered?{" "}
                <Link
                to="/signup"
                  className="text-blue-700 hover:underline dark:text-blue-500"
                >
                  Create account
                </Link>
                <br/>
                Are you a chef?{" "}
                <Link
                  className="text-blue-700 hover:underline dark:text-blue-500 cursor-pointer"
                 to='/cheflogin'
                >
                  Login here
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
}

export default LoginPage;
