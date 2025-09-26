import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { FaClock, FaUser, FaEnvelope, FaCalendarAlt, FaDownload, FaFilter, FaExclamationCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AdminAttendancePage = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ userId: '', from: '', to: '', type: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/attendance/admin/list');
      const records = res.data.data || [];
      console.log('📊 Fetched records:', records.length);
      console.log('📋 Status values found:', [...new Set(records.map(r => r.status))]);
      console.log('📋 Sample records:', records.slice(0, 3));
      setAllRecords(records);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-filter records when filters or allRecords change
  useEffect(() => {
    let filtered = [...allRecords];

    // Filter by User ID (search in name or email)
    if (filters.userId.trim()) {
      const searchTerm = filters.userId.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.userId?.name?.toLowerCase().includes(searchTerm) ||
        record.userId?.email?.toLowerCase().includes(searchTerm) ||
        record.userId?._id?.toString().includes(searchTerm)
      );
    }

    // Filter by Type
    if (filters.type) {
      console.log('🔍 Type filtering - looking for:', filters.type);
      filtered = filtered.filter(record => {
        // Match based on the record type
        return record.type === filters.type;
      });
      console.log(`🏷️ Type filter result: ${filtered.length} records`);
    }

    // Filter by Date Range
    if (filters.from || filters.to) {
      filtered = filtered.filter(record => {
        // Get the record date from checkInTime, checkOutTime, or createdAt
        let recordDate = null;
        if (record.checkInTime) {
          recordDate = new Date(record.checkInTime);
        } else if (record.checkOutTime) {
          recordDate = new Date(record.checkOutTime);
        } else if (record.createdAt) {
          recordDate = new Date(record.createdAt);
        }
        
        if (!recordDate || isNaN(recordDate.getTime())) return false;
        
        // Set time to start/end of day for proper comparison
        const fromDate = filters.from ? new Date(filters.from + 'T00:00:00') : null;
        const toDate = filters.to ? new Date(filters.to + 'T23:59:59') : null;

        if (fromDate && toDate) {
          // Both dates provided - check if record is within range
          return recordDate >= fromDate && recordDate <= toDate;
        } else if (fromDate) {
          // Only from date - check if record is after from date
          return recordDate >= fromDate;
        } else if (toDate) {
          // Only to date - check if record is before to date
          return recordDate <= toDate;
        }
        
        return true;
      });
    }

    setFilteredRecords(filtered);
  }, [allRecords, filters]);

  const exportCsv = () => {
    const header = ['User','Email','Status','Check In','Check Out'];
    const rows = filteredRecords.map(r => [
      r.userId?.name || '',
      r.userId?.email || '',
      r.type || '',
      r.type === 'check-in' && r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
      r.type === 'check-out' && r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
    ]);
    const csv = [header, ...rows].map(a => a.map(v => `"${(v ?? '').toString().replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#418EFD]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F44336]/10 border border-[#F44336] text-[#F44336] px-4 py-3 rounded-lg relative flex items-center" role="alert">
        <FaExclamationCircle className="mr-2" />
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC] mb-6">
        <div className="p-4 bg-[#418EFD] text-white flex items-center">
          <FaFilter className="mr-2" />
          <h2 className="text-lg font-semibold">Attendance Filters</h2>
        </div>
        
        <div className="p-4">
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaUser className="inline mr-1" />
                Search User
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                placeholder="Search by name, email, or ID" 
                value={filters.userId} 
                onChange={e=>setFilters({ ...filters, userId: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaCalendarAlt className="inline mr-1" />
                From Date
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                type="date" 
                value={filters.from} 
                onChange={e=>setFilters({ ...filters, from: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaCalendarAlt className="inline mr-1" />
                To Date
              </label>
              <input 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                type="date" 
                value={filters.to} 
                onChange={e=>setFilters({ ...filters, to: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#2A2A34] mb-2">
                <FaClock className="inline mr-1" />
                Type
              </label>
              <select 
                className="w-full border border-[#8BBAFC] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#418EFD] focus:border-transparent" 
                value={filters.type} 
                onChange={e=>setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="check-in">Check In</option>
                <option value="check-out">Check Out</option>
              </select>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({ userId: '', from: '', to: '', type: '' })}
                  className="bg-[#6B7280] hover:bg-[#4B5563] text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaFilter className="mr-1" />
                  Clear
                </button>
                <button 
                  onClick={exportCsv} 
                  className="bg-[#4A4A57] hover:bg-[#3a3a47] text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <FaDownload className="mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#8BBAFC]">
        <div className="p-4 bg-[#418EFD] text-white flex items-center justify-between">
          <div className="flex items-center">
            <FaClock className="mr-2" />
            <h2 className="text-lg font-semibold">Attendance Records</h2>
          </div>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {filteredRecords.length} of {allRecords.length} records
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-[#418EFD]/10 border-b border-[#8BBAFC]">
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-[#418EFD]" />
                    <span>User</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="text-[#418EFD]" />
                    <span>Email</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-[#418EFD]" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-[#418EFD]" />
                    <span>Check In</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-left font-semibold text-sm text-[#2A2A34] whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaTimesCircle className="text-[#418EFD]" />
                    <span>Check Out</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8BBAFC]/30">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-[#418EFD]/5 transition-colors">
                    <td className="py-3 px-4 text-[#2A2A34] font-medium">{record.userId?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-[#4A4A57]">{record.userId?.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.type === 'check-in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.type === 'check-in' ? (
                          <>
                            <FaCheckCircle className="mr-1" />
                            Check In
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="mr-1" />
                            Check Out
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {record.type === 'check-in' && record.timestamp
                        ? new Date(record.timestamp).toLocaleString()
                        : (record.checkInTime
                            ? new Date(record.checkInTime).toLocaleString()
                            : '-')}
                    </td>
                    <td className="py-3 px-4 text-[#4A4A57]">
                      {record.type === 'check-out' && record.timestamp
                        ? new Date(record.timestamp).toLocaleString()
                        : (record.checkOutTime
                            ? new Date(record.checkOutTime).toLocaleString()
                            : '-')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#4A4A57]">
                    <FaClock className="mx-auto text-4xl text-[#418EFD]/50 mb-3" />
                    <p className="font-medium">No attendance records found.</p>
                    <p className="text-sm text-[#4A4A57]/80">Try adjusting your filters or check back later.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendancePage;


