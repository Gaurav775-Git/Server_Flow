import Home from "./pages/Home";
import DashboardPage from "./pages/DashboardPage";
import "./index.css";
import Canvas from "./components/sections/dashboard/Canvas";
import Sidebar from "./components/sections/dashboard/Sidebar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

const App = () => {
  // return window.location.pathname === "/dashboard" ? <DashboardPage /> : <Home />;
  // return (
  //   <div className="grid grid-cols-[340px_1fr] grid-rows-[1fr] h-screen">
  //     <Sidebar />
  //     <main className="min-w-0 h-full">
  //       <Canvas />
  //     </main>
  //   </div>
  // );
  return window.location.pathname === "/signup" ? <Signup /> : <Login />;
};

export default App;
