import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useUserStore from '../store/userStore';

const UserProfilePage = () => {
  const { userId } = useParams();
  const { currentUser, fetchUserProfile, isLoading, error } = useUserStore();

  useEffect(() => {
    fetchUserProfile(userId);
  }, [fetchUserProfile, userId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div>
        <p><strong>Username:</strong> {currentUser?.credentialId?.username}</p>
        <p><strong>Role:</strong> {currentUser?.credentialId?.role}</p>
        <p><strong>Name:</strong> {currentUser?.name}</p>
        <p><strong>Email:</strong> {currentUser?.email}</p>
        <p><strong>Contact Number:</strong> {currentUser?.contact_number}</p>
        {/* Add more user details as needed */}
      </div>
    </div>
  );
};

export default UserProfilePage; 