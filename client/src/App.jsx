import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

const App = () => {
  return window.location.pathname === "/dashboard" ? <DashboardPage /> : <Home />;
};

export default App;
