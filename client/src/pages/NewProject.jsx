import Canvas from "../components/sections/dashboard/Canvas";
import Sidebar from "../components/sections/dashboard/Sidebar";
const NewProject = () => {
  return (
    <div className="grid grid-cols-[340px_1fr] grid-rows-[1fr] h-screen">
      <Sidebar />
      <main className="min-w-0 h-full">
        <Canvas />
      </main>
    </div>
  );
};

export default NewProject;
