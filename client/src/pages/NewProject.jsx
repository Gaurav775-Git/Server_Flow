import Canvas from "../components/sections/dashboard/Canvas";
import Sidebar from "../components/sections/dashboard/Sidebar";
import Build_Button from "../components/ui/Build_Button";
import { createPortal } from "react-dom";

const NewProject = () => {
  return (
    <div className="relative h-screen">
      <div className="grid grid-cols-[340px_1fr] grid-rows-[1fr] h-full">
        <Sidebar />
        <main className="min-w-0 h-full">
          <Canvas />
        </main>
      </div>

      {createPortal(
        <div className="fixed bottom-6 right-6 z-[1000] isolate">
          <Build_Button name="Build" />
        </div>,
        document.body,
      )}
    </div>
  );
};

export default NewProject;
