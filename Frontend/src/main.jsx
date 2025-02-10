import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import 'flowbite'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationsContext'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
        <NotificationProvider>
        <AuthProvider>
        <App />
        </AuthProvider>
        </NotificationProvider>
    </BrowserRouter>
  </StrictMode>
);

// ReactDOM.render(
//   <StrictMode>
//   <BrowserRouter>
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//   </BrowserRouter>
// </StrictMode>,
// document.getElementById("root")
// )