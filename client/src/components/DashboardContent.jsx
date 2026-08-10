import { useState } from 'react';
import ProjectCard from './cards/ProjectCard';

const DashboardContent = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const projects = [
    {
      id: 1,
      title: 'Auth Service v2',
      subtitle: 'prod-cluster-us-east',
      icon: 'data_object',
      status: 'Active',
      statusType: 'active',
      details: [
        { label: 'Last Deployment', value: '2 hours ago' },
        { label: 'Triggers', value: 'HTTP, Webhook' }
      ],
      users: ['JD', 'AK']
    },
    {
      id: 2,
      title: 'Invoice Parser AI',
      subtitle: 'dev-sandbox',
      icon: 'receipt_long',
      status: 'Draft',
      statusType: 'draft',
      details: [
        { label: 'Last Edited', value: 'Yesterday, 4:20 PM' },
        { label: 'Triggers', value: 'None configured' }
      ],
      users: ['JD']
    },
    {
      id: 3,
      title: 'Payment Gateway Sync',
      subtitle: 'prod-worker-nodes',
      icon: 'warning',
      status: 'Failing',
      statusType: 'error',
      details: [
        { label: 'Failed At', value: '15 mins ago', error: true },
        { label: 'Error Type', value: 'Timeout (504)' }
      ],
      users: ['TS', 'AK']
    }
  ];

  const handleMoreClick = (projectId) => {
    console.log('More options for project:', projectId);
  };

  const filteredProjects = projects.filter((project) =>
    `${project.title} ${project.subtitle}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 py-6 md:pl-6 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-6 ">
        <div>
          <h1 className="text-3xl font-semibold text-[#e1e2eb] mb-1 ">All Projects</h1>
          <p className="text-[#bcc9ce]">Manage and monitor your backend workflows.</p>
        </div>
        <div className="flex gap-2 hidden md:flex">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bcc9ce] text-[20px]">
              search
            </span>
            <input
              className="bg-[#10131a] text-[#e1e2eb] border border-[#30363D] rounded-lg py-1 pl-10 pr-4 text-sm focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8] outline-none transition-colors duration-200 placeholder-[#bcc9ce] w-64"
              placeholder="Search projects..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-1 border border-[#30363D] rounded-lg text-[#bcc9ce] hover:bg-[#32353c]/30 transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            subtitle={project.subtitle}
            icon={project.icon}
            status={project.status}
            statusType={project.statusType}
            details={project.details}
            users={project.users}
            onMoreClick={() => handleMoreClick(project.id)}
          />
        ))}
      </div>
      {filteredProjects.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-[#30363D] p-8 text-center text-[#bcc9ce]">
          No projects match “{searchTerm}”.
        </p>
      )}
    </main>
  );
};

export default DashboardContent;
