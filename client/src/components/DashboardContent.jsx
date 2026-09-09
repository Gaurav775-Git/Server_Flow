import React, { useEffect, useState } from 'react'

const DashboardContent = () => {
const [project , setProject] = useState([]);
const [loading , setLoading] = useState(true);
const [error , setError] = useState('');

useEffect(()=>{
  const fetchProject = async()=>{
    try{
      const data = await getproject();
      setProject(data);
    }
    catch(err){
      console.log(error);
    }
    finally{
      setLoading(false);
    }
  }

  fetchProject();
},[]);

if (loading) {
  return (
    <main className="flex-1 py-6 md:pl-6 min-h-screen">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d4ff]" />
      </div>
    </main>
  );
}

return (
    <main className="flex-1 py-6 md:pl-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#e1e2eb] mb-1">
            All Projects
          </h1>
          <p className="text-sm text-[#bcc9ce]">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[#30363D] p-8 text-center text-[#bcc9ce]">
          No projects yet. Create your first project!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.name}
              subtitle={project.type}
              status={project.status}
              nodeCount={project.nodeCount}
              updatedAt={project.updatedAt}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default DashboardContent