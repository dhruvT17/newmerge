import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../api/axios';
import useAuthStore from './authStore';

// Async thunks for API calls
export const fetchLeaves = createAsyncThunk(
  'leaves/fetchLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const currentUser = useAuthStore.getState().user;
      const response = await axios.get('leaves');
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }

      const leavesData = response.data.data;
      
      const enhancedLeaves = leavesData.map(leave => {
        if (!leave._id) {
          console.warn('Leave record missing _id:', leave);
          return null;
        }

        // Properly handle user_id from backend
        const userId = leave.user_id || null;
        
        // Set user name based on the actual user_id
        let userName;
        if (userId === currentUser?.userId) {
          userName = currentUser.username;
        } else if (leave.user_name && leave.user_name !== 'Unknown') {
          userName = leave.user_name;
        } else {
          userName = 'Not Assigned';
        }

        return {
          ...leave,
          user_id: userId, // Keep the original user_id from backend
          user_name: userName
        };
      }).filter(Boolean);
      
      return enhancedLeaves;
    } catch (error) {
      console.error('Fetch leaves error:', error);
      return rejectWithValue(error.message || 'Failed to fetch leaves');
    }
  }
);

export const createLeave = createAsyncThunk(
  'leaves/createLeave',
  async (leaveData, { rejectWithValue }) => {
    try {
      const currentUser = useAuthStore.getState().user;

      if (!currentUser?.userId) {
        throw new Error('User not authenticated');
      }

      // Ensure user_name is always set when creating a leave
      const leaveWithUser = {
        ...leaveData,
        user_id: currentUser.userId,
        user_name: currentUser.username || 'Not Assigned'
      };

      const response = await axios.post('leaves', leaveWithUser);
      return {
        ...response.data.data,
        user_id: currentUser.userId,
        user_name: currentUser.username || 'Not Assigned'
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave request');
    }
  }
);

export const updateLeave = createAsyncThunk(
  'leaves/updateLeave',
  async ({ id, leaveData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`leaves/${id}`, leaveData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave request');
    }
  }
);

// New thunk for accepting leave requests
export const acceptLeave = createAsyncThunk(
  'leaves/acceptLeave',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`leaves/${id}/accept`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept leave request');
    }
  }
);

// New thunk for rejecting leave requests
export const rejectLeave = createAsyncThunk(
  'leaves/rejectLeave',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`leaves/${id}/reject`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject leave request');
    }
  }
);

export const deleteLeave = createAsyncThunk(
  'leaves/deleteLeave',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`leaves/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete leave request');
    }
  }
);

export const fetchLeaveById = createAsyncThunk(
  'leaves/fetchLeaveById',
  async (id, { rejectWithValue, getState }) => {
    try {
      // First check if we already have the leave in our state
      const existingLeave = getState().leaves.leaves.find(leave => leave._id === id);
      
      if (existingLeave) {
        return existingLeave;
      }
      
      // If not, fetch all leaves and find the one we need
      const response = await axios.get('leaves');
      const allLeaves = response.data.data;
      const targetLeave = allLeaves.find(leave => leave._id === id);
      
      if (!targetLeave) {
        return rejectWithValue('Leave request not found');
      }
      
      return targetLeave;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave details');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState: {
    leaves: [],
    currentLeave: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentLeave: (state, action) => {
      state.currentLeave = action.payload;
    },
    clearCurrentLeave: (state) => {
      state.currentLeave = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.leaves = action.payload || [];
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
         state.isLoading = false;
        state.error = action.payload || 'An error occurred while fetching leaves';
        state.leaves = []; // Clear leaves on error
      })
      // Create leave
      .addCase(createLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.leaves.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update leave
      .addCase(updateLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Accept leave
      .addCase(acceptLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = {
            ...action.payload,
            status: 'Approved' // Ensure frontend status matches what we display
          };
        }
        state.isLoading = false;
      })
      .addCase(acceptLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reject leave
      .addCase(rejectLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const index = state.leaves.findIndex(leave => leave._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = {
            ...action.payload,
            status: 'Rejected' // Ensure frontend status matches what we display
          };
        }
        state.isLoading = false;
      })
      .addCase(rejectLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete leave
      .addCase(deleteLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteLeave.fulfilled, (state, action) => {
        state.leaves = state.leaves.filter(leave => leave._id !== action.payload);
        state.isLoading = false;
      })
      .addCase(deleteLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch leave by ID
      .addCase(fetchLeaveById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaveById.fulfilled, (state, action) => {
        state.currentLeave = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchLeaveById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentLeave, clearCurrentLeave } = leaveSlice.actions;
export default leaveSlice.reducer;