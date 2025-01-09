import React from 'react'
import {createUserWithEmailAndPassword} from 'firebase/auth'

import {Link, useNavigate} from 'react-router-dom'
import { Field, Form, Formik } from 'formik';
import { auth } from '../../Firebase/firebase';
import * as Yup from 'yup'


function ChefSignUpPage() {
    const navigate = useNavigate();


const handleSignUp = (email, password) =>{
    createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    navigate("/login", { replace: true });
    console.log("User created account:", user);
    
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Authentication error:", errorMessage);
    // ..
  });
}

const initialValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: ""
};


// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Name is required")
    .min(3, "Name must be at least 3 characters long")
    .max(50, "Name must not exceed 50 characters"),
  email: Yup.string()
    .required("Email is required")
    .email("Invalid email format"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
    // .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    // .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    // .matches(/[0-9]/, "Password must contain at least one number"),
  passwordConfirm: Yup.string()
    .required("Password confirmation is required")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
});

  return (
    <section className="flex items-center justify-center min-h-screen">
      {/* {isToastVisible && 
        <Toast type={toast.type} message={toast.message} onClose={()=> setIsToastVisible(false)}/>
      } */}
      <div className="w-full flex flex-col max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
        <Formik initialValues={initialValues} onSubmit={()=>{ }} validationSchema={validationSchema}>
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              <h5 className="text-xl font-medium text-gray-900 dark:text-white">
                Create Chef Account
              </h5>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="text"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Your Name
                </label>
                <Field
                  type="name"
                  name="name"
                  id="name"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                  placeholder="John Doe"
                />
                {errors.name && touched.name ? (<div className='text-xs text-red-500'>{errors.name}</div>) : null}
              </div>
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
                {errors.email && touched.email ? (<div className='text-xs text-red-500'>{errors.email}</div>) : null}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Set password
                </label>
                
                <Field
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                />
                {errors.password && touched.password ? (<div className='text-xs text-red-500'>{errors.password}</div>) : null}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Confirm password
                </label>
                
                <Field
                  type="password"
                  name="passwordConfirm"
                  id="passwordConfirm"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                />
                {errors.passwordConfirm && touched.passwordConfirm ? (<div className='text-xs text-red-500'>{errors.passwordConfirm}</div>) : null}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-secondary bg-amber-300 hover:bg-yellow-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {isSubmitting ? "Signing up..." : "Create Chef Account"}
              </button>

              {/* Register Link */}
              <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Already have a chef account?{" "}
                
                <Link
                to="/cheflogin"
                  className="text-blue-700 hover:underline dark:text-blue-500"
                >
                Chef Login
                </Link>
              </div>
              
            </Form>
          )}
          
        </Formik>
      </div>
    </section>

  )
}

export default ChefSignUpPage
