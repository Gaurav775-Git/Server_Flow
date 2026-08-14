import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Playground_Page from "./pages/Playground_Page";
import NewProject from "./pages/NewProject";
import ServerNode from "./components/sections/dashboard/nodes/ServerNode";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/playground" element={<Playground_Page />} />
        <Route path="/newproject" element={<NewProject />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
      </Routes>
    </Router>
  );
};

export default App;
