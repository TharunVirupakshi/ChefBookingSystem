import React from 'react'
import {getAuth , createUserWithEmailAndPassword} from 'firebase/auth'
import {useNavigate} from 'react-router-dom'



function SignUpPage() {
    const navigate = useNavigate();
const auth = getAuth();


const handleSignUp = () =>{
    createUserWithEmailAndPassword(auth, 'test2@gmail.com', '2345678')
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


  return (
    <div className='text-center'>
      <h1>Signup</h1>
      <button onClick={handleSignUp} className='border-2 p-3'>Create Account</button>
    </div>
  )
}

export default SignUpPage
