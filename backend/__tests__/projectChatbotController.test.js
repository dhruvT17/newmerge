const request = require('supertest');
const express = require('express');
const projectChatbotController = require('../controllers/projectChatbotController');

// Mock the MongoDB and Gemini dependencies
jest.mock('@google/generative-ai');
jest.mock('mongodb');

const app = express();
app.use(express.json());

// Test routes
app.post('/api/project-chatbot/', projectChatbotController.handleProjectChat);
app.get('/api/project-chatbot/analytics', projectChatbotController.getProjectAnalytics);

describe('Project Chatbot Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/project-chatbot/', () => {
    it('should handle project queries', async () => {
      const mockQuery = {
        collection: 'projects',
        filter: { 'project_details.status': 'active' },
        fields: ['project_details.name', 'project_details.status']
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
        toArray: jest.fn().mockResolvedValue([
          {
            'project_details.name': 'Test Project',
            'project_details.status': 'active'
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
        .post('/api/project-chatbot/')
        .send({ message: 'Find active projects' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('queryType');
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        collection: 'projects',
        filter: { 'project_details.status': 'nonexistent' },
        fields: ['project_details.name']
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
        .post('/api/project-chatbot/')
        .send({ message: 'Find nonexistent projects' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toContain('No matching');
    });
  });

  describe('GET /api/project-chatbot/analytics', () => {
    it('should return project analytics', async () => {
      const { MongoClient } = require('mongodb');
      const mockCollection = {
        aggregate: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([
          { _id: 'active', count: 5, avgProgress: 65.2 },
          { _id: 'completed', count: 3, avgProgress: 100 }
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
        .get('/api/project-chatbot/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analytics');
      expect(Array.isArray(response.body.analytics)).toBe(true);
    });
  });
});
