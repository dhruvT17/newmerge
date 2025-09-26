import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ClientList from '../components/client/ClientList';
import ClientForm from '../components/client/ClientForm';
import ClientDetail from '../components/client/ClientDetail';
import { FaPlus, FaUsers } from 'react-icons/fa';
import { fetchClients, setCurrentClient, clearCurrentClient } from '../store/clientStore';

const ClientManagementPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleCreateClient = () => {
    dispatch(clearCurrentClient());
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditClient = (client) => {
    dispatch(setCurrentClient(client));
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    // Clear the current client when form is closed
    dispatch(clearCurrentClient());
    // Refresh the clients list to show updated data
    dispatch(fetchClients());
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-3 text-blue-600" />
          Client Management
        </h1>
        <button 
          onClick={handleCreateClient} 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <FaPlus className="mr-2" />
          Add New Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <ClientList onEditClient={handleEditClient} />
      </div>

      <ClientForm 
        isOpen={showForm}
        onClose={handleCloseForm}
        isEditing={isEditing}
      />
    </div>
  );
};

export default ClientManagementPage;