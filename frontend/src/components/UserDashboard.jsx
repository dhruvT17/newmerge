import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext'; // Import UserContext
import useAuthStore from '../store/authStore'; // Import useAuthStore
import axios from '../api/axios';

const UserDashboard = () => {
  const { user, setUser } = useUser(); // Use UserContext
  const { logout: authLogout } = useAuthStore(); // Get logout function from authStore
  const [hasFaceData, setHasFaceData] = useState(true);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null); // Clear user data on logout
    authLogout(); // Call the logout function from authStore
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get('/users/me/profile');
        setHasFaceData(Boolean(res.data?.hasFaceData));
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">User Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user?.username}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow">Loading...</div>
        ) : !hasFaceData ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Face Registration Required</h2>
            <p className="mb-4">Please register your face to continue to attendance.</p>
            <a href="/face-register" className="bg-blue-600 text-white px-4 py-2 rounded">Register Now</a>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Attendance</h2>
            <p className="mb-4">Use face recognition to check in and out.</p>
            <a href="/attendance" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Go to Attendance
            </a>
          </div>
          {/* User Dashboard Widgets */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">My Projects</h2>
            {/* Add projects content */}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
            {/* Add tasks content */}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {/* Add activity content */}
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard; 
