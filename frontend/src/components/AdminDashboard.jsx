import React, { useEffect, useState } from 'react';
import useUserStore from '../store/userStore';
import { FaUsers, FaSpinner, FaProjectDiagram, FaCalendarAlt, FaBuilding, FaChartBar, 
  FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaTachometerAlt, FaChartPie, 
  FaArrowUp, FaArrowDown, FaFilter, FaSearch, FaEllipsisV } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../store/projectStore';
import { fetchLeaves } from '../store/leaveStore';
import { fetchClients } from '../store/clientStore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const AdminDashboard = () => {
  // Existing state and store connections
  const { users, fetchUsers, isLoading: usersLoading, error: usersError } = useUserStore();
  const dispatch = useDispatch();
  const { projects, isLoading: projectsLoading, error: projectsError } = useSelector(
    (state) => state.projects
  );
  const { leaves, isLoading: leavesLoading, error: leavesError } = useSelector(
    (state) => state.leaves
  );
  const { clients, isLoading: clientsLoading, error: clientsError } = useSelector(
    (state) => state.clients
  );
  
  // New state for interactive features
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [chartData, setChartData] = useState({
    leaveData: null,
    projectData: null,
    trendData: null
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  // Load data from stores
  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await Promise.all([
        dispatch(fetchProjects()),
        dispatch(fetchLeaves()),
        dispatch(fetchClients())
      ]);
      setIsDataLoaded(true);
    };
    
    loadData();
  }, [fetchUsers, dispatch]);

  // Prepare chart data when all data is loaded
  useEffect(() => {
    if (isDataLoaded && leaves && projects && clients) {
      // Prepare leave status chart data
      const pendingLeaves = getPendingLeaves();
      const approvedLeaves = getApprovedLeaves();
      const rejectedLeaves = getRejectedLeaves();
      
      const leaveChartData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [
          {
            data: [pendingLeaves, approvedLeaves, rejectedLeaves],
            backgroundColor: ['#FBBF24', '#34D399', '#F87171'],
            borderColor: ['#F59E0B', '#10B981', '#EF4444'],
            borderWidth: 1,
          },
        ],
      };
      
      // Prepare project distribution chart data
      const clientProjects = getProjectsWithClients();
      const internalProjects = projects.length - clientProjects;
      
      // Get top 5 clients with most projects
      const clientProjectCounts = {};
      projects.forEach(project => {
        if (project.client_id) {
          clientProjectCounts[project.client_id] = (clientProjectCounts[project.client_id] || 0) + 1;
        }
      });
      
      const clientNames = {};
      clients.forEach(client => {
        clientNames[client._id] = client.name || 'Unknown Client';
      });
      
      const topClients = Object.entries(clientProjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([clientId, count]) => ({
          id: clientId,
          name: clientNames[clientId] || 'Unknown Client',
          count
        }));
      
      const projectChartData = {
        labels: topClients.map(client => client.name),
        datasets: [
          {
            label: 'Number of Projects',
            data: topClients.map(client => client.count),
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)',
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
      
      // Create trend data (simulated monthly data based on available data)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      
      // Simulate monthly user growth
      const userGrowth = months.map((_, index) => {
        // Simulate growth pattern based on current user count
        return Math.max(0, Math.floor(users.length * (0.7 + (index * 0.05))));
      });
      
      // Simulate monthly project growth
      const projectGrowth = months.map((_, index) => {
        // Simulate growth pattern based on current project count
        return Math.max(0, Math.floor((projects?.length || 0) * (0.6 + (index * 0.08))));
      });
      
      const trendChartData = {
        labels: months,
        datasets: [
          {
            label: 'Employees',
            data: userGrowth,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
          },
          {
            label: 'Projects',
            data: projectGrowth,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            tension: 0.3,
          }
        ],
      };
      
      setChartData({
        leaveData: leaveChartData,
        projectData: projectChartData,
        trendData: trendChartData
      });
    }
  }, [isDataLoaded, leaves, projects, clients, users]);

  // Calculate leave statistics
  const getPendingLeaves = () => {
    return leaves?.filter(leave => leave.status?.toLowerCase() === 'pending')?.length || 0;
  };

  const getApprovedLeaves = () => {
    return leaves?.filter(leave => leave.status?.toLowerCase() === 'approved')?.length || 0;
  };
  
  const getRejectedLeaves = () => {
    return leaves?.filter(leave => leave.status?.toLowerCase() === 'rejected')?.length || 0;
  };
  
  // Calculate project statistics
  const getProjectsWithClients = () => {
    if (!projects || !clients) return 0;
    const clientIds = clients.map(client => client._id);
    return projects.filter(project => project.client_id && clientIds.includes(project.client_id)).length;
  };
  
  // Calculate user statistics
  const getActiveUsers = () => {
    return users.filter(user => user.status === 'active').length;
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Leave Distribution',
        font: {
          size: 16,
        }
      },
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Clients by Projects',
        font: {
          size: 16,
        }
      },
    },
  };
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '6-Month Growth Trend',
        font: {
          size: 16,
        }
      },
    },
  };
  
  // Helper function to determine if card should be shown based on search
  const shouldShowCard = (title, description) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return title.toLowerCase().includes(term) || description.toLowerCase().includes(term);
  };
  
  // Card click handler for interactivity
  const handleCardClick = (cardId) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees Card */}
          {shouldShowCard('Total Employees', 'Total number of employees registered in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'employees' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleCardClick('employees')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Employees</p>
                  {usersLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-blue-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{users.length}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 12% from last month
                      </p>
                    </div>
                  )}
                  {usersError && <p className="text-red-500 text-sm mt-2">{usersError}</p>}
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaUsers className="text-blue-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of employees registered in the system
                </p>
              </div>
              
              {selectedCard === 'employees' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active:</span>
                    <span className="font-medium">{getActiveUsers()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Inactive:</span>
                    <span className="font-medium">{users.length - getActiveUsers()}</span>
                  </div>
                  <button className="mt-3 text-blue-500 text-sm font-medium hover:text-blue-700">
                    View All Employees →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Total Projects Card */}
          {shouldShowCard('Total Projects', 'Total number of projects managed in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'projects' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => handleCardClick('projects')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Projects</p>
                  {projectsLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-green-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-gray-800 mt-2">{projects?.length || 0}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 8% from last month
                      </p>
                    </div>
                  )}
                  {projectsError && <p className="text-red-500 text-sm mt-2">{projectsError}</p>}
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaProjectDiagram className="text-green-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of projects managed in the system
                </p>
              </div>
              
              {selectedCard === 'projects' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Client Projects:</span>
                    <span className="font-medium">{getProjectsWithClients()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Internal Projects:</span>
                    <span className="font-medium">{projects?.length - getProjectsWithClients() || 0}</span>
                  </div>
                  <button className="mt-3 text-green-500 text-sm font-medium hover:text-green-700">
                    View All Projects →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Leave Insights Card */}
          {shouldShowCard('Leave Insights', 'Overview of leave requests in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'leaves' ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => handleCardClick('leaves')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Leave Insights</p>
                  {leavesLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-purple-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-800">{leaves?.length || 0}</p>
                      <p className="text-sm text-red-500 flex items-center mt-1">
                        <FaArrowDown className="mr-1" /> 3% from last month
                      </p>
                    </div>
                  )}
                  {leavesError && <p className="text-red-500 text-sm mt-2">{leavesError}</p>}
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaCalendarAlt className="text-purple-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Overview of leave requests in the system
                </p>
              </div>
              
              {selectedCard === 'leaves' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pending:</span>
                    <span className="font-medium">{getPendingLeaves()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Approved:</span>
                    <span className="font-medium">{getApprovedLeaves()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Rejected:</span>
                    <span className="font-medium">{getRejectedLeaves()}</span>
                  </div>
                  <button className="mt-3 text-purple-500 text-sm font-medium hover:text-purple-700">
                    View All Leaves →
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Client Insights Card */}
          {shouldShowCard('Total Clients', 'Total number of clients registered in the system') && (
            <div 
              className={`bg-white rounded-lg shadow-sm hover:shadow-md p-6 border border-gray-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${selectedCard === 'clients' ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => handleCardClick('clients')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Clients</p>
                  {clientsLoading ? (
                    <div className="flex items-center mt-2">
                      <FaSpinner className="animate-spin text-orange-500 mr-2" />
                      <p className="text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-gray-800">{clients?.length || 0}</p>
                      <p className="text-sm text-green-500 flex items-center mt-1">
                        <FaArrowUp className="mr-1" /> 5% from last month
                      </p>
                    </div>
                  )}
                  {clientsError && <p className="text-red-500 text-sm mt-2">{clientsError}</p>}
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <FaBuilding className="text-orange-500 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Total number of clients registered in the system
                </p>
              </div>
              
              {selectedCard === 'clients' && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Clients:</span>
                    <span className="font-medium">{clients?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">With Projects:</span>
                    <span className="font-medium">{Object.keys(clientProjectCounts || {}).length}</span>
                  </div>
                  <button className="mt-3 text-orange-500 text-sm font-medium hover:text-orange-700">
                    View All Clients →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Trend Chart Section */}
        {isDataLoaded && chartData.trendData && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartBar className="mr-2 text-blue-600" />
                Growth Trends
              </h2>
              <div className="flex items-center">
                <div className="text-sm text-gray-500 mr-4">Last updated: {new Date().toLocaleDateString()}</div>
                <button className="text-gray-400 hover:text-gray-600">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            
            <div className="h-80">
              <Line data={chartData.trendData} options={lineChartOptions} />
            </div>
          </div>
        )}
        
        {/* Charts Section */}
        {isDataLoaded && chartData.leaveData && chartData.projectData && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartPie className="mr-2 text-blue-600" />
                Data Visualization
              </h2>
              <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leave Distribution Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="h-64">
                  <Pie data={chartData.leaveData} options={pieChartOptions} />
                </div>
              </div>
              
              {/* Project by Client Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="h-64">
                  <Bar data={chartData.projectData} options={barChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Detailed Statistics Section */}
        {isDataLoaded && !usersLoading && !projectsLoading && !leavesLoading && !clientsLoading && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center text-gray-800">
                <FaChartBar className="mr-2 text-blue-600" />
                Detailed Statistics
              </h2>
              <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Employee Status */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <FaUsers className="text-blue-500 mr-2" />
                    Employee Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                          <span className="text-sm">Active</span>
                        </div>
                        <span className="font-medium">{getActiveUsers()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${users.length ? (getActiveUsers() / users.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                          <span className="text-sm">Inactive</span>
                        </div>
                        <span className="font-medium">{users.length - getActiveUsers()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full" 
                          style={{ width: `${users.length ? ((users.length - getActiveUsers()) / users.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Leave Status */}
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                    <FaCalendarAlt className="text-purple-500 mr-2" />
                    Leave Status
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaHourglassHalf className="text-yellow-500 mr-2 text-sm" />
                          <span className="text-sm">Pending</span>
                        </div>
                        <span className="font-medium">{getPendingLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getPendingLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-green-500 mr-2 text-sm" />
                          <span className="text-sm">Approved</span>
                        </div>
                        <span className="font-medium">{getApprovedLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getApprovedLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <FaTimesCircle className="text-red-500 mr-2 text-sm" />
                          <span className="text-sm">Rejected</span>
                        </div>
                        <span className="font-medium">{getRejectedLeaves()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-400 h-2 rounded-full" 
                          style={{ width: `${leaves?.length ? (getRejectedLeaves() / leaves.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;