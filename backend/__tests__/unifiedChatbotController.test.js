const request = require('supertest');
const express = require('express');
const unifiedChatbotController = require('../controllers/unifiedChatbotController');

// Mock the MongoDB and Gemini dependencies
jest.mock('@google/generative-ai');
jest.mock('mongodb');

const app = express();
app.use(express.json());

// Test routes
app.post('/api/chatbot/', unifiedChatbotController.handleUnifiedChat);
app.get('/api/chatbot/analytics', unifiedChatbotController.getSystemAnalytics);

describe('Unified Chatbot Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/chatbot/', () => {
    it('should handle user queries', async () => {
      const mockQuery = {
        collection: 'users',
        filter: { 'status': 'active', 'skills': 'React' },
        fields: ['name', 'email', 'skills', 'status']
      };

      // Mock Gemini response
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify(mockQuery)
        }
      };

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue(mockGeminiResponse)
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      // Mock MongoDB response
      const { MongoClient } = require('mongodb');
      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          {
            name: 'John Doe',
            email: 'john@example.com',
            skills: ['React', 'Node.js'],
            status: 'active'
          }
        ])
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      const mockClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnValue(mockDb),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Find active users with React skills' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('queryType');
      expect(response.body.queryType).toBe('users');
    });

    it('should handle project queries', async () => {
      const mockQuery = {
        collection: 'projects',
        filter: { 'project_details.status': 'active' },
        fields: ['project_details.name', 'project_details.status', 'project_leads']
      };

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => JSON.stringify(mockQuery) }
        })
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      const { MongoClient } = require('mongodb');
      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          {
            'project_details.name': 'E-commerce Platform',
            'project_details.status': 'active',
            'project_leads': ['507f1f77bcf86cd799439011']
          }
        ])
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      const mockClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnValue(mockDb),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Find active projects' });

      expect(response.status).toBe(200);
      expect(response.body.queryType).toBe('projects');
    });

    it('should handle aggregation queries', async () => {
      const mockQuery = {
        collection: 'combined',
        aggregation: [
          { "$lookup": { "from": "projects", "localField": "project_id", "foreignField": "_id", "as": "project" } },
          { "$match": { "due_date": { "$lt": new Date() }, "status": { "$ne": "Done" } } }
        ],
        fields: ['title', 'due_date', 'priority', 'project.project_details.name']
      };

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => JSON.stringify(mockQuery) }
        })
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      const { MongoClient } = require('mongodb');
      const mockCollection = {
        aggregate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          {
            title: 'Fix bug in login',
            due_date: new Date('2023-01-01'),
            priority: 'High',
            'project.project_details.name': 'E-commerce Platform'
          }
        ])
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      const mockClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnValue(mockDb),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Show overdue tasks with their project names' });

      expect(response.status).toBe(200);
      expect(response.body.queryType).toBe('combined');
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        collection: 'users',
        filter: { 'status': 'nonexistent' },
        fields: ['name', 'email']
      };

      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => JSON.stringify(mockQuery) }
        })
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      const { MongoClient } = require('mongodb');
      const mockCollection = {
        find: jest.fn().mockReturnThis(),
        project: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      const mockClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnValue(mockDb),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Find nonexistent users' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toContain('No matching records found');
    });
  });

  describe('GET /api/chatbot/analytics', () => {
    it('should return system analytics', async () => {
      const { MongoClient } = require('mongodb');
      
      // Mock project analytics
      const mockProjectCollection = {
        aggregate: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          { _id: 'active', count: 5, avgProgress: 65.2 },
          { _id: 'completed', count: 3, avgProgress: 100 }
        ])
      };
      
      // Mock user stats
      const mockUserCollection = {
        aggregate: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          { _id: 'active', count: 25 },
          { _id: 'inactive', count: 5 }
        ])
      };
      
      // Mock task stats
      const mockTaskCollection = {
        aggregate: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          { _id: 'To-do', count: 10 },
          { _id: 'In Progress', count: 12 },
          { _id: 'Done', count: 8 }
        ])
      };
      
      const mockDb = {
        collection: jest.fn().mockImplementation((name) => {
          switch(name) {
            case 'projects': return mockProjectCollection;
            case 'users': return mockUserCollection;
            case 'tasks': return mockTaskCollection;
            default: return mockProjectCollection;
          }
        })
      };
      
      const mockClient = {
        connect: jest.fn(),
        db: jest.fn().mockReturnValue(mockDb),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .get('/api/chatbot/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projectAnalytics');
      expect(response.body).toHaveProperty('userStats');
      expect(response.body).toHaveProperty('taskStats');
      expect(Array.isArray(response.body.projectAnalytics)).toBe(true);
      expect(Array.isArray(response.body.userStats)).toBe(true);
      expect(Array.isArray(response.body.taskStats)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini API errors', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('Gemini API Error'))
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Test query' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle MongoDB connection errors', async () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => JSON.stringify({ collection: 'users', filter: {}, fields: ['name'] }) }
        })
      };
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      const { MongoClient } = require('mongodb');
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('MongoDB Connection Error')),
        close: jest.fn()
      };
      MongoClient.mockImplementation(() => mockClient);

      const response = await request(app)
        .post('/api/chatbot/')
        .send({ message: 'Test query' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
