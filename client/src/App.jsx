import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Canvas from "./components/sections/dashboard/Canvas";
import Sidebar from "./components/sections/dashboard/Sidebar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import {BrowserRouter as Router , Routes ,Route} from 'react-router-dom'

const App = () => {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
      </Routes>
    </Router>
  );
};

export default App;
