import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import DragAndDrop from "./components/sections/dashboard/DragAndDrop";

const App = () => {
  // return window.location.pathname === "/dashboard" ? <DashboardPage /> : <Home />;
  return (
    <>
      <DragAndDrop />
    </>
  );
};

export default App;
