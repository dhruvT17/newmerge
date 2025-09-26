# Project Management Chatbot API

## Overview
The Project Management Chatbot is an AI-powered assistant that helps administrators query and analyze project data using natural language. It supports complex queries across Projects, Tasks, and Users collections with intelligent filtering, searching, and analytics capabilities.

## Endpoints

### 1. Main Chatbot Endpoint
**POST** `/api/project-chatbot/`

#### Request Body
```json
{
  "message": "Find all active projects with their team leads"
}
```

#### Response
```json
{
  "data": [
    {
      "project_details.name": "E-commerce Platform",
      "project_details.status": "active",
      "project_leads": ["507f1f77bcf86cd799439011"],
      "kanban.epics.team_lead_id": ["507f1f77bcf86cd799439012"]
    }
  ],
  "message": "Found 3 matching records in projects collection.",
  "queryType": "projects",
  "fields": ["project_details.name", "project_details.status", "project_leads", "kanban.epics.team_lead_id"]
}
```

### 2. Project Analytics Endpoint
**GET** `/api/project-chatbot/analytics`

#### Response
```json
{
  "analytics": [
    {
      "_id": "active",
      "count": 5,
      "avgProgress": 65.2
    },
    {
      "_id": "completed",
      "count": 3,
      "avgProgress": 100
    }
  ]
}
```

## Query Capabilities

### 1. Project Management Queries

#### Project Status Queries
- "Show all active projects"
- "Find completed projects from last month"
- "Projects with low progress"
- "Projects starting this week"

#### Project Team Queries
- "Projects led by John Doe"
- "Team members in React project"
- "Projects with more than 5 team members"
- "Find project leads for active projects"

#### Technology-based Queries
- "Projects using React technology"
- "Epics with Node.js in them"
- "Projects with Python backend"
- "Find projects using MongoDB"

### 2. Task Management Queries

#### Task Status Queries
- "Show overdue tasks"
- "High priority tasks"
- "Tasks in progress"
- "Completed tasks this week"

#### Task Assignment Queries
- "Tasks assigned to Sarah"
- "Unassigned tasks"
- "Tasks due this month"
- "Tasks with no progress"

#### Cross-Project Task Queries
- "Overdue tasks across all projects"
- "High priority tasks by project"
- "Task completion rate by project"

### 3. Kanban Board Queries

#### Epic Management
- "Epics in progress"
- "Epics with no tasks"
- "Epics starting this month"
- "Epics assigned to specific team lead"

#### Task Status in Kanban
- "Tasks in To-do status"
- "Tasks stuck in In Progress"
- "Tasks moved to Done today"

### 4. Timeline and Scheduling Queries

#### Date-based Queries
- "Projects ending this month"
- "Tasks due next week"
- "Epics starting in Q2"
- "Projects created last quarter"

#### Progress Tracking
- "Projects with progress less than 50%"
- "Tasks with 0% progress"
- "Epics completed this month"

### 5. Client and Business Queries

#### Client Relations
- "Projects for Acme Corp"
- "Client project status overview"
- "Projects by client priority"

#### Business Analytics
- "Project completion rates"
- "Average project duration"
- "Team utilization by project"

### 6. Advanced Cross-Collection Queries

#### User-Project Relationships
- "Users working on multiple projects"
- "Project workload by user"
- "Team members across all active projects"

#### Task-Project Analytics
- "Task count by project"
- "Average tasks per epic"
- "Task completion rate by project"

## Example Queries

### Simple Project Queries
```javascript
// Find active projects
POST /api/project-chatbot/
{
  "message": "Show all active projects with their names and progress"
}

// Find projects by technology
POST /api/project-chatbot/
{
  "message": "Find projects using React technology"
}
```

### Complex Task Queries
```javascript
// Overdue tasks with project context
POST /api/project-chatbot/
{
  "message": "Show overdue tasks with their project names and assigned users"
}

// High priority tasks by project
POST /api/project-chatbot/
{
  "message": "Find high priority tasks grouped by project"
}
```

### Team Management Queries
```javascript
// Team workload analysis
POST /api/project-chatbot/
{
  "message": "Show team members working on multiple projects"
}

// Project leadership
POST /api/project-chatbot/
{
  "message": "Find all project leads and their active projects"
}
```

### Analytics Queries
```javascript
// Progress analysis
POST /api/project-chatbot/
{
  "message": "Show projects with progress less than 50%"
}

// Timeline analysis
POST /api/project-chatbot/
{
  "message": "Find projects ending this month with their completion status"
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
  "message": "No matching projects, tasks, or users found.",
  "queryType": "projects"
}
```

## Integration Notes

### Frontend Integration
The chatbot can be integrated into the frontend using the existing chat component pattern:

```javascript
// Example frontend usage
const sendProjectQuery = async (message) => {
  const response = await fetch('/api/project-chatbot/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  });
  return response.json();
};
```

### Authentication
The chatbot endpoints should be protected with authentication middleware to ensure only authorized users can access project data.

### Rate Limiting
Consider implementing rate limiting to prevent abuse of the AI-powered query system.

## Performance Considerations

- Queries are limited to 20 results by default
- Complex aggregations may take longer to process
- Consider caching frequently requested analytics
- Monitor MongoDB query performance for optimization

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live project updates
2. **Predictive Analytics**: AI-powered project completion predictions
3. **Resource Optimization**: Team workload balancing suggestions
4. **Integration**: Connect with external project management tools
5. **Custom Dashboards**: Generate dynamic reports based on queries
