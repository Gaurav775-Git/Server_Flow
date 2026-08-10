import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Canvas from "./components/sections/dashboard/Canvas";

const App = () => {
  // return window.location.pathname === "/dashboard" ? <DashboardPage /> : <Home />;
  return (
    <>
      <Canvas />
    </>
  );
};

export default App;
