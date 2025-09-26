import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaves, acceptLeave, rejectLeave, setCurrentLeave, clearCurrentLeave } from '../store/leaveStore';
import LeaveList from '../components/leave/LeaveList';
import LeaveForm from '../components/leave/LeaveForm';
import LeaveDetail from '../components/leave/LeaveDetail';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { useUser } from '../context/UserContext';

const LeaveManagementPage = () => {
  const dispatch = useDispatch();
  const { user } = useUser();
  const { leaves, isLoading, error } = useSelector((state) => state.leaves);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    dispatch(fetchLeaves());
  }, [dispatch]);

  useEffect(() => {
    if (!leaves) return;

    // Base list (by role)
    const baseLeaves = isAdmin ? leaves : leaves.filter(leave => leave.user_id === user?.userId);

    // Filter by status
    const filtered = filterStatus === 'all'
      ? baseLeaves
      : baseLeaves.filter(leave => leave.status === filterStatus);

    // Sort so most recently acted-on (status_updated_at) or newly created (createdAt) are on top
    const sorted = [...filtered].sort((a, b) => {
      const aStatus = a.status_updated_at ? new Date(a.status_updated_at).getTime() : 0;
      const bStatus = b.status_updated_at ? new Date(b.status_updated_at).getTime() : 0;
      if (aStatus !== bStatus) return bStatus - aStatus;
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });

    setFilteredLeaves(sorted);
  }, [leaves, filterStatus, isAdmin, user]);

  const handleApproveLeave = async (id) => {
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      await dispatch(acceptLeave(id));
      await dispatch(fetchLeaves());
    }
  };

  const handleRejectLeave = async (id) => {
    const remarks = window.prompt('Please provide a reason for rejection:');
    if (remarks !== null) {
      await dispatch(rejectLeave({ id, admin_remarks: remarks }));
      await dispatch(fetchLeaves());
    }
  };

  const handleEditLeave = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeave(null);
    dispatch(fetchLeaves()); // Refresh the list after modal closes
  };

  // Add success handler
  const handleLeaveSuccess = () => {
    dispatch(fetchLeaves()); // Refresh the list
    handleCloseModal(); // Close the modal
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <FaCalendarAlt className="mr-3 text-blue-600" />
          Leave Management
        </h1>
        {!isAdmin && (
          <button
            onClick={() => {
              setSelectedLeave(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <FaPlus className="mr-2" />
            New Leave Request
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filterStatus">
            Filter by Status:
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="all">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <LeaveList 
            leaves={filteredLeaves} 
            onEditLeave={handleEditLeave}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
          />
        )}
      </div>

      {/* Update the LeaveForm usage */}
      <LeaveForm 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isEditing={!!selectedLeave}
        leave={selectedLeave}
        onSuccess={handleLeaveSuccess}
      />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/view/:id" element={<LeaveDetail />} />
    </Routes>
  );
};

export default LeaveManagementPage;
