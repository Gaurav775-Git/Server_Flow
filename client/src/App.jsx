import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";

import NewProject from "./pages/NewProject";
import Download from "./pages/Download";
import { useAuth } from "./utils/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loading, isAuth } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#0d1117]" aria-busy="true" />;
  }

  return isAuth ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/playground" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/playground/download" element={<ProtectedRoute><Download /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
      </Routes>
    </Router>
  );
};

export default App;
