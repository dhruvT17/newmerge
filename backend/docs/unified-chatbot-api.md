# Unified WorkFusion Chatbot API

## Overview
The Unified WorkFusion Chatbot is a comprehensive AI-powered assistant that handles queries across all aspects of the WorkFusion management system. It intelligently processes natural language queries for Users, Projects, Tasks, Clients, Leaves, and Attendance data.

## Key Features
- **Multi-Collection Support**: Queries across Users, Projects, Tasks, Clients, Leaves, and Attendance
- **Intelligent Query Processing**: Natural language to MongoDB query conversion
- **Cross-Collection Analytics**: Complex queries spanning multiple collections
- **Smart Data Summarization**: AI-powered result formatting and insights
- **Backward Compatibility**: Maintains existing API endpoints

## Endpoints

### 1. Main Chatbot Endpoint
**POST** `/api/chatbot/`

#### Request Body
```json
{
  "message": "Find active users with React skills"
}
```

#### Response
```json
{
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "skills": ["React", "Node.js", "JavaScript"],
      "status": "active"
    }
  ],
  "message": "Found 3 matching records in users collection.",
  "queryType": "users",
  "fields": ["name", "email", "skills", "status"]
}
```

### 2. System Analytics Endpoint
**GET** `/api/chatbot/analytics`

#### Response
```json
{
  "projectAnalytics": [
    {
      "_id": "active",
      "count": 5,
      "avgProgress": 65.2
    }
  ],
  "userStats": [
    {
      "_id": "active",
      "count": 25
    }
  ],
  "taskStats": [
    {
      "_id": "In Progress",
      "count": 12
    }
  ]
}
```

## Comprehensive Query Categories

### 1. User Management Queries

#### User Information
- "Show all active users"
- "Find users with React skills"
- "Users from Mumbai"
- "Inactive users"

#### Skills & Expertise
- "Developers who know Python"
- "Users skilled in React and Node.js"
- "Find frontend developers"
- "Users with specific technology expertise"

#### Status & Activity
- "Active users with profile pictures"
- "Users without contact numbers"
- "Recently registered users"

#### Location & Contact
- "Users from specific city"
- "Users with contact numbers"
- "Users in specific address"

### 2. Project Management Queries

#### Project Status
- "Show all active projects"
- "Completed projects from last month"
- "Projects with low progress"
- "Projects starting this week"

#### Project Details
- "Projects with progress less than 50%"
- "High priority projects"
- "Projects ending this month"
- "Projects by client"

#### Team Management
- "Projects led by John Doe"
- "Team members in React project"
- "Projects with more than 5 team members"
- "Find project leads for active projects"

#### Technology Queries
- "Projects using React technology"
- "Epics with Node.js in them"
- "Projects with Python backend"
- "Find projects using MongoDB"

### 3. Task Management Queries

#### Task Status
- "Show overdue tasks"
- "High priority tasks"
- "Tasks in progress"
- "Completed tasks this week"

#### Task Assignment
- "Tasks assigned to Sarah"
- "Unassigned tasks"
- "Tasks due this month"
- "Tasks with no progress"

#### Cross-Project Tasks
- "Overdue tasks across all projects"
- "High priority tasks by project"
- "Task completion rate by project"
- "Tasks completed this month"

### 4. Kanban Board Queries

#### Epic Management
- "Epics in progress"
- "Epics with no tasks"
- "Epics starting this month"
- "Epics assigned to specific team lead"

#### Task Status in Kanban
- "Tasks in To-do status"
- "Tasks stuck in In Progress"
- "Tasks moved to Done today"
- "Epic completion status"

### 5. Client & Business Queries

#### Client Relations
- "Projects for Acme Corp"
- "Client project status overview"
- "Projects by client priority"
- "Client project completion rates"

#### Business Analytics
- "Project completion rates"
- "Average project duration"
- "Team utilization by project"
- "Resource allocation analysis"

### 6. Attendance & Leave Queries

#### Attendance Management
- "Users who checked in today"
- "Late arrivals this week"
- "Attendance patterns"
- "Frequent absentees"

#### Leave Management
- "Pending leave requests"
- "Users on leave this month"
- "Leave approval status"
- "Leave patterns by user"

### 7. Cross-Collection Analytics

#### User-Project Relationships
- "Users working on multiple projects"
- "Project workload by user"
- "Team members across all active projects"
- "User project assignments"

#### Task-Project Analytics
- "Task count by project"
- "Average tasks per epic"
- "Task completion rate by project"
- "Project progress by tasks"

#### Comprehensive Analytics
- "Active users with their project assignments and task counts"
- "Project completion rates by client"
- "Team utilization across all projects"
- "System-wide performance metrics"

## Example Queries

### Simple User Queries
```javascript
// Find active users with specific skills
POST /api/chatbot/
{
  "message": "Show active users with React skills"
}

// Find users by location
POST /api/chatbot/
{
  "message": "Find users from Mumbai"
}
```

### Project Management Queries
```javascript
// Find active projects
POST /api/chatbot/
{
  "message": "Show all active projects with their team leads"
}

// Technology-based project search
POST /api/chatbot/
{
  "message": "Find projects using React technology"
}
```

### Complex Cross-Collection Queries
```javascript
// Users working on multiple projects
POST /api/chatbot/
{
  "message": "Find users working on multiple projects"
}

// Project completion rates by client
POST /api/chatbot/
{
  "message": "Show project completion rates by client"
}
```

### Task Management Queries
```javascript
// Overdue tasks with project context
POST /api/chatbot/
{
  "message": "Show overdue tasks with their project names"
}

// High priority tasks by project
POST /api/chatbot/
{
  "message": "Find high priority tasks grouped by project"
}
```

### Attendance & Leave Queries
```javascript
// Today's attendance
POST /api/chatbot/
{
  "message": "Show users who checked in today"
}

// Leave management
POST /api/chatbot/
{
  "message": "Find pending leave requests"
}
```

## Advanced Query Features

### Aggregation Pipelines
The chatbot supports complex MongoDB aggregation pipelines for advanced analytics:

```javascript
// Example: Project completion rates with client details
{
  "collection": "combined",
  "aggregation": [
    { "$lookup": { "from": "clients", "localField": "client_id", "foreignField": "_id", "as": "client" } },
    { "$group": {
      "_id": "$client.name",
      "totalProjects": { "$sum": 1 },
      "completedProjects": { "$sum": { "$cond": [{ "$eq": ["$project_details.status", "completed"] }, 1, 0] } },
      "avgProgress": { "$avg": "$project_details.progress" }
    } },
    { "$addFields": { "completionRate": { "$multiply": [{ "$divide": ["$completedProjects", "$totalProjects"] }, 100] } } }
  ]
}
```

### Cross-Collection Joins
Support for complex relationships between collections:

```javascript
// Example: Users with their project assignments
{
  "collection": "combined",
  "aggregation": [
    { "$lookup": { "from": "projects", "localField": "_id", "foreignField": "project_leads", "as": "ledProjects" } },
    { "$lookup": { "from": "projects", "localField": "_id", "foreignField": "kanban.epics.team_members", "as": "memberProjects" } },
    { "$addFields": { "totalProjects": { "$add": [{ "$size": "$ledProjects" }, { "$size": "$memberProjects" }] } } }
  ]
}
```

## Error Handling

### Common Error Responses
```json
{
  "error": "Invalid MongoDB query format",
  "message": "Unable to parse the query. Please try rephrasing your request."
}
```

```json
{
  "data": [],
  "message": "No matching records found in users collection.",
  "queryType": "users"
}
```

## Integration Examples

### Frontend Integration
```javascript
// Unified chatbot usage
const sendChatbotQuery = async (message) => {
  const response = await fetch('/api/chatbot/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });
  return response.json();
};

// Example usage
const result = await sendChatbotQuery("Find active users with React skills");
console.log(result.data); // Array of matching users
```

### Analytics Integration
```javascript
// Get system analytics
const getSystemAnalytics = async () => {
  const response = await fetch('/api/chatbot/analytics');
  return response.json();
};

// Example usage
const analytics = await getSystemAnalytics();
console.log(analytics.projectAnalytics); // Project statistics
console.log(analytics.userStats); // User statistics
console.log(analytics.taskStats); // Task statistics
```

## Performance Considerations

- **Query Limits**: Default limit of 20 results per query
- **Aggregation Performance**: Complex aggregations may take longer
- **Caching**: Consider caching frequently requested analytics
- **Indexing**: Ensure proper MongoDB indexes for performance
- **Rate Limiting**: Implement rate limiting for production use

## Security Considerations

- **Authentication**: Protect endpoints with authentication middleware
- **Authorization**: Implement role-based access control
- **Input Validation**: Validate and sanitize user inputs
- **Query Limits**: Prevent resource-intensive queries
- **Audit Logging**: Log all chatbot interactions

## Migration from Separate Chatbots

### Backward Compatibility
The unified chatbot maintains backward compatibility with existing implementations:

- **Same Endpoint**: `/api/chatbot/` continues to work
- **Same Response Format**: Response structure remains consistent
- **Legacy Support**: Old function names still work

### Migration Steps
1. **No Code Changes Required**: Existing frontend code continues to work
2. **Enhanced Capabilities**: New query types automatically available
3. **Improved Performance**: Better query optimization and caching
4. **Extended Analytics**: Access to comprehensive system analytics

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Predictive Analytics**: AI-powered predictions and recommendations
3. **Custom Dashboards**: Dynamic report generation
4. **Voice Interface**: Speech-to-text query support
5. **Mobile Optimization**: Enhanced mobile chatbot experience
6. **Integration APIs**: Connect with external tools and services
7. **Advanced AI**: Context-aware conversations and follow-up queries
8. **Performance Optimization**: Query caching and optimization
9. **Security Enhancements**: Advanced authentication and authorization
10. **Analytics Expansion**: More detailed business intelligence features
