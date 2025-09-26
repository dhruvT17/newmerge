import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, setCurrentProject, clearCurrentProject } from '../store/projectStore';
import { fetchClients } from '../store/clientStore';
import ProjectList from '../components/project/ProjectList';
import ProjectForm from '../components/project/ProjectForm';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaProjectDiagram, FaColumns, FaExclamationCircle, FaChartLine } from 'react-icons/fa';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import axios from '../api/axios';

const ProjectManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, isLoading, error } = useSelector((state) => state.projects);
  const { users, fetchUsers } = useUserStore();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === 'Admin';
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchClients());
    if (isAdmin) {
      fetchUsers();
    }
  }, [dispatch, fetchUsers, isAdmin]);

  const handleCreateProject = () => {
    if (!isAdmin) return; // Guard: only Admin can create projects
    dispatch(clearCurrentProject());
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditProject = (project) => {
    dispatch(setCurrentProject(project));
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false); // Reset editing state
  };

  const handleOpenKanban = (project) => {
    dispatch(setCurrentProject(project));
    navigate(`/project/${project._id}/kanban`);
  };

  // Add a new effect to refresh projects when form closes
  useEffect(() => {
    if (!showForm) {
      dispatch(fetchProjects()); // Refresh the projects list when form closes
      dispatch(clearCurrentProject()); // Clear current project when form closes
    }
  }, [showForm, dispatch]);

  // Navigation tabs
  const navigationTabs = [
    { id: 'projects', label: 'Projects', icon: <FaProjectDiagram className="mr-2" /> },
    { id: 'kanban', label: 'Kanban Boards', icon: <FaColumns className="mr-2" /> }
  ];

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-[#2A2A34]">Project Management</h1>
        {isAdmin && (
          <button
            onClick={handleCreateProject}
            className="bg-[#418EFD] hover:bg-[#307ae3] text-white font-medium py-2.5 px-5 rounded-lg flex items-center transition-colors"
          >
            <FaProjectDiagram className="mr-2" />
            Create New Project
          </button>
        )}
      </div>


      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-[#8BBAFC]">
          <nav className="flex -mb-px">
            {navigationTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#418EFD] text-[#418EFD] bg-[#418EFD]/5'
                    : 'text-[#4A4A57] hover:text-[#2A2A34] hover:bg-[#418EFD]/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative mb-4 flex items-center" role="alert">
          <FaExclamationCircle className="mr-2" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#418EFD]"></div>
        </div>
      ) : (
        <>
          {activeTab === 'projects' && (
            <ProjectList 
              projects={projects} 
              onEditProject={handleEditProject}
              onOpenKanban={handleOpenKanban}
              onAssignProject={isAdmin ? ((project) => {
                setSelectedProject(project);
                setSelectedManagerId('');
                setShowAssignModal(true);
              }) : undefined}
            />
          )}
          
          {activeTab === 'kanban' && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#8BBAFC]">
              <h2 className="text-xl font-semibold mb-6 text-[#2A2A34] flex items-center">
                <FaColumns className="mr-3 text-[#418EFD]" />
                Kanban Boards
              </h2>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(project => (
                    <div 
                      key={project._id} 
                      className="border border-[#8BBAFC] rounded-xl p-5 cursor-pointer bg-white 
                        transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl 
                        hover:border-[#418EFD] group relative overflow-hidden
                        before:absolute before:inset-0 before:bg-[#418EFD]/5 before:opacity-0 
                        before:transition-opacity hover:before:opacity-100"
                      onClick={() => handleOpenKanban(project)}
                    >
                      <div className="flex justify-between items-start mb-3 relative">
                        <h3 className="font-medium text-lg text-[#2A2A34] group-hover:text-[#418EFD] transition-colors duration-300">
                          {project.project_details.name}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium transform transition-transform group-hover:scale-105 ${
                          project.project_details.status === 'Completed' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
                          project.project_details.status === 'In Progress' ? 'bg-[#418EFD]/10 text-[#418EFD]' :
                          project.project_details.status === 'On Hold' ? 'bg-[#FFA726]/10 text-[#FFA726]' :
                          'bg-[#4A4A57]/10 text-[#4A4A57]'
                        }`}>
                          {project.project_details.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-[#4A4A57]">
                          <FaProjectDiagram className="mr-2 text-[#418EFD]" />
                          <span>Priority: </span>
                          <span className={`ml-2 font-medium ${
                            project.project_details.priority === 'High' ? 'text-[#F44336]' :
                            project.project_details.priority === 'Medium' ? 'text-[#FFA726]' :
                            'text-[#4CAF50]'
                          }`}>
                            {project.project_details.priority}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-[#4A4A57]">
                          <FaChartLine className="mr-2 text-[#418EFD]" />
                          <span>Progress</span>
                          <div className="ml-2 flex-1 max-w-[150px]">
                            <div className="w-full bg-[#418EFD]/10 rounded-full h-1.5">
                              <div 
                                className="bg-[#418EFD] h-1.5 rounded-full transition-all" 
                                style={{ width: `${project.project_details.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="ml-2 font-medium">{project.project_details.progress || 0}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#8BBAFC]/30 relative">
                        <div className="text-sm text-[#4A4A57] group-hover:text-[#2A2A34] transition-colors duration-300">
                          {new Date(project.project_details.start_date).toLocaleDateString()} - {new Date(project.project_details.end_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-[#418EFD] transform transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#307ae3]">
                          <span className="mr-2 font-medium">Open Board</span>
                          <FaColumns className="transform transition-transform group-hover:rotate-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaProjectDiagram className="mx-auto text-4xl text-[#418EFD]/50 mb-3" />
                  <p className="text-[#4A4A57] font-medium">No projects available.</p>
                  <p className="text-sm text-[#4A4A57]/80">Create a project to get started with Kanban boards.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#8BBAFC]">
              <h2 className="text-xl font-semibold mb-4 text-[#2A2A34]">Tasks Overview</h2>
              <p className="text-[#4A4A57]">Task management view will be implemented here.</p>
            </div>
          )}
        </>
      )}

      <ProjectForm 
        isOpen={showForm}
        onClose={handleCloseForm}
        isEditing={isEditing}
      />

      {isAdmin && showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 border border-[#8BBAFC] p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Project Manager</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <div className="p-3 bg-gray-50 rounded-md">
                {selectedProject?.project_details?.name || selectedProject?.name || 'Selected Project'}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Project Manager</label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a Project Manager --</option>
                {users.filter(u => (u.credentialId?.role || u.role) === 'Project Manager').map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedProject(null); setSelectedManagerId(''); }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedProject || !selectedManagerId) return;
                  try {
                    const res = await axios.post('/projects/assign-manager', {
                      projectId: selectedProject._id,
                      projectManagerId: selectedManagerId
                    });
                    if (res?.data?.success) {
                      setShowAssignModal(false);
                      setSelectedProject(null);
                      setSelectedManagerId('');
                      dispatch(fetchProjects());
                      alert('Project Manager assigned successfully!');
                    } else {
                      alert(res?.data?.message || 'Failed to assign project manager');
                    }
                  } catch (err) {
                    console.error('Assign manager failed:', err);
                    alert(err.response?.data?.message || 'Failed to assign project manager');
                  }
                }}
                disabled={!selectedManagerId}
                className={`px-4 py-2 rounded-md font-medium ${selectedManagerId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementPage;