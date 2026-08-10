import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Canvas from "./components/sections/dashboard/Canvas";
import Sidebar from "./components/sections/dashboard/Sidebar";

const App = () => {
  // return window.location.pathname === "/dashboard" ? <DashboardPage /> : <Home />;
  return (
    <>
      {/* <Canvas /> */}
      <Sidebar />
    </>
  );
};

export default App;
