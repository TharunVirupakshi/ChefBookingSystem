import './App.css'
import {Route,Routes} from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
function App() {
  

  return (
    <>
      <div>
          <Routes>
            <Route path='/' element={<LoginPage/>}/>
          </Routes>
       </div>
    </>
  )
}

export default App
