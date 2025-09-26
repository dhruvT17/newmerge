import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import { FaPaperPlane, FaSpinner, FaRobot, FaExclamationCircle, FaSearch } from 'react-icons/fa';

const ChatComponent = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await axiosInstance.post('/chatbot', {
        message
      });
      
      const newChat = {
        query: message,
        data: result.data.data,
        message: result.data.message,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, newChat]);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableHeaders = (data) => {
    if (!data || data.length === 0) return null;
    // Get the first item to determine available fields
    const fields = Object.keys(data[0]);
    return (
      <tr>
        {fields.map((field) => (
          <th key={field} className="px-4 py-2 text-left text-xs font-semibold text-[#2A2A34] tracking-wider border-b">
            {field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
          </th>
        ))}
      </tr>
    );
  };

  const renderTableRow = (item, idx) => {
    if (!item) return null;
    const fields = Object.keys(item);
    return (
      <tr key={idx} className="hover:bg-[#418EFD]/5 transition-colors">
        {fields.map((field) => (
          <td key={field} className="px-4 py-2 text-xs text-[#4A4A57] whitespace-normal break-words">
            {field === 'status' ? (
              <span className={`px-2 py-1 rounded-full ${
                item[field] === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item[field]}
              </span>
            ) : field === 'skills' ? (
              Array.isArray(item[field]) ? item[field].join(', ') : item[field]
            ) : (
              item[field]
            )}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((chat, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-start space-x-2">
              <div className="bg-[#418EFD]/10 rounded-lg py-3 px-4 max-w-[90%]">
                <p className="text-[#2A2A34] text-sm">{chat.query}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg border border-[#8BBAFC]/30 p-4">
              {chat.data && chat.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#418EFD]/10">
                      {renderTableHeaders(chat.data)}
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {chat.data.map((item, idx) => renderTableRow(item, idx))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-200">
            <FaExclamationCircle className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Chat Input Form */}
      <div className="p-4 border-t border-[#8BBAFC]/30">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8BBAFC]" />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-[#8BBAFC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#418EFD]/50 bg-white hover:bg-gray-50/80 transition-colors"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-[#418EFD] text-white rounded-lg hover:bg-[#307ae3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span className="text-sm">Searching...</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="text-sm" />
                <span className="text-sm">Search</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;