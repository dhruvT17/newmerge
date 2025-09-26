# WorkFusion Unified Chatbot Testing Guide

## 🚀 Quick Test

### 1. Test Endpoint
```bash
GET http://localhost:5000/api/chatbot/test
```

**Expected Response:**
```json
{
  "message": "WorkFusion Unified Chatbot is running!",
  "status": "active",
  "capabilities": [...],
  "exampleQueries": [...]
}
```

### 2. Greeting Test
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Hello"
}
```

**Expected Response:**
```json
{
  "data": [],
  "message": "Hello! I'm your WorkFusion AI assistant. I can help you query and analyze data across your entire system including: ...",
  "queryType": "greeting",
  "fields": []
}
```

### 3. Help Test
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "help"
}
```

**Expected Response:**
```json
{
  "data": [],
  "message": "I can help you with comprehensive WorkFusion system queries! Here are some examples: ...",
  "queryType": "help",
  "fields": []
}
```

## 📋 Collection-Specific Tests

### Users Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Find active users"
}
```

### Projects Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Show all projects"
}
```

### Tasks Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Find all tasks"
}
```

### Clients Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Show all clients"
}
```

### Leaves Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Find all leave requests"
}
```

### Attendance Collection
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Show attendance records"
}
```

## 🔧 Advanced Tests

### Cross-Collection Queries
```bash
POST http://localhost:5000/api/chatbot/
Content-Type: application/json

{
  "message": "Users working on multiple projects"
}
```

### Analytics Test
```bash
GET http://localhost:5000/api/chatbot/analytics
```

## 🐛 Troubleshooting

### Common Issues

1. **"No matching records found"**
   - Check if the collection has data
   - Verify collection name in MongoDB
   - Try simpler queries first

2. **"Invalid response from Gemini"**
   - Check GEMINI_API_KEY in environment variables
   - Verify internet connection
   - Try rephrasing the query

3. **"MongoDB Connection Error"**
   - Check MONGO_URI in environment variables
   - Verify MongoDB is running
   - Check database and collection names

### Debug Logs
The chatbot now includes debug logs. Check the console for:
- Query Config: Shows how the query was parsed
- Query Results: Shows number of records found
- Error details: Shows specific error information

## 📊 Expected Response Format

All successful queries return:
```json
{
  "data": [...],           // Array of matching records
  "message": "...",        // Human-readable message
  "queryType": "...",      // Collection or context type
  "fields": [...]          // Fields that were requested
}
```

## 🎯 Test Scenarios

### Scenario 1: New User Onboarding
1. Send greeting: "Hello"
2. Ask for help: "What can you do?"
3. Try a simple query: "Find active users"

### Scenario 2: Project Management
1. Query projects: "Show all active projects"
2. Query tasks: "Find overdue tasks"
3. Cross-query: "Users working on multiple projects"

### Scenario 3: Error Handling
1. Send invalid query: "asdfghjkl"
2. Send empty message: ""
3. Send very long message: [long text]

## ✅ Success Criteria

The chatbot is working correctly if:
- ✅ Greeting responses work
- ✅ Help responses work
- ✅ All collection queries return data or appropriate "no data" messages
- ✅ Error handling provides helpful messages
- ✅ Response format is consistent
- ✅ Debug logs show query processing

## 🔄 Continuous Testing

Run these tests regularly:
1. **Startup Test**: `GET /api/chatbot/test`
2. **Greeting Test**: `POST /api/chatbot/` with "hello"
3. **Collection Test**: Test each collection with simple queries
4. **Error Test**: Test with invalid queries
5. **Analytics Test**: `GET /api/chatbot/analytics`
