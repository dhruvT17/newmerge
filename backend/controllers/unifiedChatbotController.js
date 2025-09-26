const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME || "users";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function convertToUnifiedMongoQuery(userInput) {
  const prompt = `
You are an AI converting natural language into MongoDB queries for a comprehensive WorkFusion management system.
Available Collections and Schemas:

1. USERS Collection:
- _id: ObjectId
- credentialId: ObjectId (ref: Credentials)
- name: String
- email: String (unique)
- contact_number: String
- address: String
- skills: [String]
- profile_picture: {
  - url: String
  - upload_date: Date
}
- faceData: {
  - front: String
  - left: String
  - right: String
  - frontDescriptor: [Number]
  - leftDescriptor: [Number]
  - rightDescriptor: [Number]
}
- preferences: {
  - languages: [String]
}
- status: String (enum: ['active', 'inactive'])
- additional_fields: Map<String>
- createdAt: Date
- updatedAt: Date

2. PROJECTS Collection:
- _id: ObjectId
- client_id: ObjectId (ref: Client)
- project_details: {
  - name: String
  - description: String
  - start_date: Date
  - end_date: Date
  - status: String
  - priority: String
  - progress: Number
  - additional_fields: Map<String>
}
- kanban: {
  - epics: [{
    - epic_id: ObjectId
    - name: String
    - team_lead_id: ObjectId (ref: User)
    - team_members: [ObjectId] (ref: User)
    - technologies: [{ name: String, version: String, type: String }]
    - start_date: Date
    - end_date: Date
    - tasks: [{ task_id: ObjectId (ref: Task) }]
    - status: String
  }]
}
- project_leads: [ObjectId] (ref: User)
- attachments: [{ file_name: String, file_url: String, uploaded_by: ObjectId, upload_date: Date }]
- additional_fields: Map<String>
- createdAt: Date
- updatedAt: Date

3. TASKS Collection:
- _id: ObjectId
- project_id: ObjectId (ref: Project)
- epic_id: ObjectId (ref: Project.kanban.epics)
- title: String
- description: String
- assigned_to: [ObjectId] (ref: User)
- created_by: ObjectId (ref: User)
- start_date: Date
- due_date: Date
- priority: String (enum: ["Low", "Medium", "High"])
- status: String (enum: ["To-do", "In Progress", "Done"])
- progress: Number (0-100)
- attachments: [{ file_name: String, file_url: String, uploaded_by: ObjectId, upload_date: Date }]
- comments: [{ user: ObjectId, text: String, created_at: Date }]
- additional_fields: Map<String>
- createdAt: Date
- updatedAt: Date

4. CLIENTS Collection:
- _id: ObjectId
- name: String
- email: String
- contact_number: String
- address: String
- additional_fields: Map<String>
- createdAt: Date
- updatedAt: Date

5. LEAVES Collection:
- _id: ObjectId
- user_id: ObjectId (ref: User)
- leave_type: String
- start_date: Date
- end_date: Date
- status: String
- reason: String
- createdAt: Date
- updatedAt: Date

6. ATTENDANCE Collection:
- _id: ObjectId
- user_id: ObjectId (ref: User)
- check_in: Date
- check_out: Date
- date: Date
- status: String
- createdAt: Date
- updatedAt: Date

Return a JSON object with these properties:
1. collection: String ("users", "projects", "tasks", "clients", "leaves", "attendance", or "combined")
2. filter: MongoDB filter object
3. fields: Array of field names to return
4. aggregation: Optional aggregation pipeline for complex queries
5. sort: Optional sort object
6. limit: Optional limit number

IMPORTANT: Always use the exact collection names: "users", "projects", "tasks", "clients", "leaves", "attendance"
For cross-collection queries, use "combined" with aggregation pipelines.

Handle these comprehensive query patterns:

USER MANAGEMENT QUERIES:
- User Information: "active users", "users with React skills", "users from Mumbai"
- Skills & Expertise: "developers who know Python", "users skilled in React and Node.js"
- Status & Activity: "inactive users", "users with profile pictures"
- Location & Contact: "users from specific city", "users with contact numbers"

PROJECT MANAGEMENT QUERIES:
- Project Status: "active projects", "completed projects", "projects in progress"
- Project Details: "projects with low progress", "projects ending this month"
- Team Management: "projects led by [user]", "team members in [project]"
- Technology: "projects using React", "epics with Node.js", "projects with Python"

TASK MANAGEMENT QUERIES:
- Task Status: "overdue tasks", "high priority tasks", "tasks in progress"
- Task Assignment: "tasks assigned to [user]", "unassigned tasks"
- Timeline: "tasks due this week", "tasks completed this month"
- Cross-Project: "overdue tasks across all projects", "task completion rate by project"

KANBAN BOARD QUERIES:
- Epic Management: "epics in progress", "epics with no tasks", "epics starting this month"
- Task Status: "tasks in To-do status", "tasks stuck in In Progress"
- Team Workload: "team members across all active projects"

CLIENT & BUSINESS QUERIES:
- Client Relations: "projects for [client]", "client project status"
- Business Analytics: "project completion rates", "average project duration"
- Resource Management: "team utilization by project", "workload distribution"

ATTENDANCE & LEAVE QUERIES:
- Attendance: "users who checked in today", "late arrivals this week"
- Leave Management: "pending leave requests", "users on leave this month"
- Work Patterns: "attendance patterns", "frequent absentees"

CROSS-COLLECTION QUERIES:
- User-Project: "users working on multiple projects", "project workload by user"
- Task-Project: "task count by project", "average tasks per epic"
- Comprehensive: "active users with their project assignments and task counts"

Examples:
"Find active users with React skills" => 
{
  "collection": "users",
  "filter": { 
    "$and": [
      { "status": "active" },
      { "skills": "React" }
    ]
  },
  "fields": ["name", "email", "skills", "status"]
}

"Show all projects" =>
{
  "collection": "projects",
  "filter": {},
  "fields": ["project_details.name", "project_details.status", "project_details.progress", "project_leads"]
}

"Find all tasks" =>
{
  "collection": "tasks", 
  "filter": {},
  "fields": ["title", "status", "priority", "assigned_to", "due_date"]
}

"Show overdue tasks with their project names" =>
{
  "collection": "combined",
  "aggregation": [
    { "$lookup": { "from": "projects", "localField": "project_id", "foreignField": "_id", "as": "project" } },
    { "$match": { "due_date": { "$lt": new Date() }, "status": { "$ne": "Done" } } },
    { "$project": { "title": 1, "due_date": 1, "priority": 1, "project.project_details.name": 1 } }
  ],
  "fields": ["title", "due_date", "priority", "project.project_details.name"]
}

"Find users working on multiple projects" =>
{
  "collection": "combined",
  "aggregation": [
    { "$lookup": { "from": "projects", "localField": "_id", "foreignField": "project_leads", "as": "ledProjects" } },
    { "$lookup": { "from": "projects", "localField": "_id", "foreignField": "kanban.epics.team_members", "as": "memberProjects" } },
    { "$addFields": { "totalProjects": { "$add": [{ "$size": "$ledProjects" }, { "$size": "$memberProjects" }] } } },
    { "$match": { "totalProjects": { "$gt": 1 } } },
    { "$project": { "name": 1, "email": 1, "totalProjects": 1, "ledProjects.project_details.name": 1, "memberProjects.project_details.name": 1 } }
  ],
  "fields": ["name", "email", "totalProjects", "ledProjects.project_details.name", "memberProjects.project_details.name"]
}

"Show project completion rates by client" =>
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
  ],
  "fields": ["_id", "totalProjects", "completedProjects", "avgProgress", "completionRate"]
}

Only return the JSON object:
"${userInput}"
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const json = response.match(/{[\s\S]*}/)?.[0];
  
  // Default query if parsing fails - try to detect collection from input
  const lowerInput = userInput.toLowerCase();
  let defaultCollection = "users";
  let defaultFields = ["name", "email", "skills", "status"];
  
  // More specific collection detection
  if (lowerInput.includes('project') || lowerInput.includes('all projects') || lowerInput.includes('show projects')) {
    defaultCollection = "projects";
    defaultFields = ["project_details.name", "project_details.status", "project_details.progress", "project_leads"];
  } else if (lowerInput.includes('task') || lowerInput.includes('all tasks') || lowerInput.includes('show tasks')) {
    defaultCollection = "tasks";
    defaultFields = ["title", "status", "priority", "assigned_to", "due_date"];
  } else if (lowerInput.includes('client') || lowerInput.includes('all clients') || lowerInput.includes('show clients')) {
    defaultCollection = "clients";
    defaultFields = ["name", "email", "contact_number", "address"];
  } else if (lowerInput.includes('leave') || lowerInput.includes('all leaves') || lowerInput.includes('show leaves')) {
    defaultCollection = "leaves";
    defaultFields = ["leave_type", "start_date", "end_date", "status", "reason"];
  } else if (lowerInput.includes('attendance') || lowerInput.includes('check') || lowerInput.includes('all attendance')) {
    defaultCollection = "attendance";
    defaultFields = ["check_in", "check_out", "date", "status"];
  } else if (lowerInput.includes('user') || lowerInput.includes('all users') || lowerInput.includes('show users')) {
    defaultCollection = "users";
    defaultFields = ["name", "email", "skills", "status"];
  }
  
  const defaultQuery = {
    collection: defaultCollection,
    filter: {},
    fields: defaultFields
  };

  try {
    const parsedQuery = json ? JSON.parse(json) : defaultQuery;
    
    // Force correct collection if Gemini got it wrong
    if (lowerInput.includes('project') && parsedQuery.collection !== 'projects') {
      console.log('Forcing collection to projects for project query');
      parsedQuery.collection = 'projects';
      parsedQuery.fields = ["project_details.name", "project_details.status", "project_details.progress", "project_leads"];
    } else if (lowerInput.includes('task') && parsedQuery.collection !== 'tasks') {
      console.log('Forcing collection to tasks for task query');
      parsedQuery.collection = 'tasks';
      parsedQuery.fields = ["title", "status", "priority", "assigned_to", "due_date"];
    } else if (lowerInput.includes('client') && parsedQuery.collection !== 'clients') {
      console.log('Forcing collection to clients for client query');
      parsedQuery.collection = 'clients';
      parsedQuery.fields = ["name", "email", "contact_number", "address"];
    } else if (lowerInput.includes('user') && parsedQuery.collection !== 'users') {
      console.log('Forcing collection to users for user query');
      parsedQuery.collection = 'users';
      parsedQuery.fields = ["name", "email", "skills", "status"];
    }
    
    return parsedQuery;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return defaultQuery;
  }
}

async function queryUnifiedMongoDB(queryConfig) {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  const { collection, filter, fields, aggregation, sort, limit } = queryConfig;
  
  try {
    // First, check if the collection exists and has data
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    if (!collectionNames.includes(collection)) {
      console.log(`Collection ${collection} not found. Available collections:`, collectionNames);
      await client.close();
      return [];
    }
    
    // Check collection count
    const count = await db.collection(collection).countDocuments();
    console.log(`Collection ${collection} has ${count} documents`);
    
    if (aggregation) {
      // Use aggregation pipeline
      const result = await db.collection(collection).aggregate(aggregation).limit(limit || 20).toArray();
      await client.close();
      return result;
    } else {
      // Use regular find query with proper projection
      let projection = {};
      
      // Handle field projections for different collections
      fields.forEach(field => {
        // Handle nested fields properly
        if (field.includes('.')) {
          projection[field] = 1;
        } else {
          // Handle special field mappings
          switch(field) {
            case 'languages':
              projection['preferences.languages'] = 1;
              break;
            case 'profile_picture':
              projection['profile_picture.url'] = 1;
              projection['profile_picture.upload_date'] = 1;
              break;
            case 'contact_number':
              projection['contact_number'] = 1;
              break;
            case 'address':
              projection['address'] = 1;
              break;
            case 'skills':
              projection['skills'] = 1;
              break;
            case 'status':
              projection['status'] = 1;
              break;
            case 'name':
              projection['name'] = 1;
              break;
            case 'email':
              projection['email'] = 1;
              break;
            case 'title':
              projection['title'] = 1;
              break;
            case 'priority':
              projection['priority'] = 1;
              break;
            case 'due_date':
              projection['due_date'] = 1;
              break;
            case 'assigned_to':
              projection['assigned_to'] = 1;
              break;
            case 'created_by':
              projection['created_by'] = 1;
              break;
            case 'project_id':
              projection['project_id'] = 1;
              break;
            case 'client_id':
              projection['client_id'] = 1;
              break;
            case 'user_id':
              projection['user_id'] = 1;
              break;
            case 'leave_type':
              projection['leave_type'] = 1;
              break;
            case 'start_date':
              projection['start_date'] = 1;
              break;
            case 'end_date':
              projection['end_date'] = 1;
              break;
            case 'reason':
              projection['reason'] = 1;
              break;
            case 'check_in':
              projection['check_in'] = 1;
              break;
            case 'check_out':
              projection['check_out'] = 1;
              break;
            case 'date':
              projection['date'] = 1;
              break;
            default:
              projection[field] = 1;
          }
        }
      });
      
      // If no projection fields specified, we'll fetch all fields by skipping .project()
      
      console.log(`Querying ${collection} with filter:`, JSON.stringify(filter));
      console.log(`Projection:`, JSON.stringify(projection));
      
      let query = db.collection(collection).find(filter);
      
      // Only apply projection if we have specific fields
      if (Object.keys(projection).length > 0) {
        query = query.project(projection);
      }
      
      if (sort) query = query.sort(sort);
      if (limit) query = query.limit(limit);
      else query = query.limit(20); // Default limit
      
      const result = await query.toArray();
      console.log(`Found ${result.length} documents in ${collection}`);
      await client.close();
      return result;
    }
  } catch (error) {
    await client.close();
    console.error(`Error querying ${collection} collection:`, error);
    throw error;
  }
}

async function summarizeUnifiedDataWithGemini(data, userQuery, fields, collection) {
  // Helper to resolve nested paths and arrays (e.g., "project_details.name" or "project.project_details.name")
  const getValueByPath = (obj, path) => {
    if (!obj) return null;
    const segments = path.split('.');
    let current = obj;
    for (let i = 0; i < segments.length; i++) {
      const key = segments[i];
      if (Array.isArray(current)) {
        // Map each element for remaining path and flatten
        const restPath = segments.slice(i).join('.');
        const mapped = current.map(el => getValueByPath(el, restPath)).filter(v => v !== undefined && v !== null);
        // If single value array, return that; otherwise return array
        return mapped.length === 0 ? null : mapped;
      }
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key];
      } else {
        return null;
      }
    }
    return current ?? null;
  };

  const cleaned = data.map(item => {
    const result = {};
    fields.forEach(field => {
      switch(field) {
        case 'languages':
          result[field] = item.preferences?.languages || [];
          break;
        case 'profile_picture':
          result[field] = {
            url: item.profile_picture?.url || null,
            upload_date: item.profile_picture?.upload_date || null
          };
          break;
        case 'skills':
          result[field] = Array.isArray(item.skills) ? item.skills : [];
          break;
        default:
          // Handle dot-path fields
          if (field.includes('.')) {
            result[field] = getValueByPath(item, field);
          } else {
            result[field] = item?.[field] ?? null;
          }
      }
    });
    return result;
  });

  const prompt = `
You're a comprehensive WorkFusion management assistant. Based on this user query:
"${userQuery}"

Analyze and return the most relevant data from the ${collection} collection.
Consider:
1. Query intent and business relevance
2. Data completeness and accuracy
3. Logical ordering (priority, due dates, progress, alphabetical)
4. Remove duplicates and invalid entries
5. Format dates and numbers appropriately
6. Include actionable insights when relevant
7. Context-aware formatting based on data type

Return a JSON array with the requested fields: ${fields.join(', ')}
Respond ONLY with a valid JSON array, no explanation or markdown.

Here is the data to work with:
${JSON.stringify(cleaned, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  const jsonText = result.response.text();
  const jsonMatch = jsonText.match(/\[.*\]/s);
  if (!jsonMatch) throw new Error("Invalid response from Gemini");
  return JSON.parse(jsonMatch[0]);
}

// Helper function to detect greetings and provide context
function detectGreetingAndContext(userInput) {
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
  const helpKeywords = ['help', 'what can you do', 'capabilities', 'commands', 'how to'];
  
  const lowerInput = userInput.toLowerCase().trim();
  
  // Check for greetings
  if (greetings.some(greeting => lowerInput.includes(greeting))) {
    return {
      type: 'greeting',
      message: `Hello! I'm your WorkFusion AI assistant. I can help you query and analyze data across your entire system including:

👥 **Users**: Find users by skills, location, status, contact info
📋 **Projects**: Track project status, team leads, progress, technologies
✅ **Tasks**: Manage tasks, assignments, priorities, due dates
🏢 **Clients**: Client information and project relationships
📅 **Leaves**: Leave requests, approvals, patterns
⏰ **Attendance**: Check-in/out records, patterns, late arrivals

**Example queries:**
- "Find active users with React skills"
- "Show all active projects"
- "Find overdue tasks"
- "Users who checked in today"
- "Project completion rates by client"

What would you like to know about your WorkFusion system?`
    };
  }
  
  // Check for help requests
  if (helpKeywords.some(keyword => lowerInput.includes(keyword))) {
    return {
      type: 'help',
      message: `I can help you with comprehensive WorkFusion system queries! Here are some examples:

**User Management:**
- "Find active users with React skills"
- "Show users from Mumbai"
- "Find developers who know Python"

**Project Management:**
- "Show all active projects with team leads"
- "Find projects using React technology"
- "Projects with progress less than 50%"

**Task Management:**
- "Show overdue tasks with project names"
- "Find high priority tasks assigned to John"
- "Tasks completed this week"

**Cross-System Analytics:**
- "Users working on multiple projects"
- "Project completion rates by client"
- "Team utilization across all projects"

**Attendance & Leave:**
- "Users who checked in today"
- "Pending leave requests"
- "Late arrivals this week"

Just ask me anything about your WorkFusion data!`
    };
  }
  
  return null;
}

exports.handleUnifiedChat = async (req, res) => {
  try {
    const userInput = req.body.message;
    
    // Check for greetings and help requests first
    const contextResponse = detectGreetingAndContext(userInput);
    if (contextResponse) {
      return res.json({
        data: [],
        message: contextResponse.message,
        queryType: contextResponse.type,
        fields: []
      });
    }
    
    // Process the query
    const queryConfig = await convertToUnifiedMongoQuery(userInput);
    console.log('Query Config:', JSON.stringify(queryConfig, null, 2)); // Debug log
    
    const results = await queryUnifiedMongoDB(queryConfig);
    console.log('Query Results:', results.length, 'records found'); // Debug log

    if (results.length === 0) {
      return res.json({ 
        data: [], 
        message: `No matching records found in ${queryConfig.collection} collection. Try rephrasing your query or ask for help to see available options.`,
        queryType: queryConfig.collection 
      });
    }

    const data = await summarizeUnifiedDataWithGemini(results, userInput, queryConfig.fields, queryConfig.collection);
    
    res.json({ 
      data, 
      message: `Found ${data.length} matching records in ${queryConfig.collection} collection.`,
      queryType: queryConfig.collection,
      fields: queryConfig.fields
    });
  } catch (err) {
    console.error("Unified chatbot error:", err);
    
    // Provide helpful error message
    const errorMessage = err.message.includes('Invalid response from Gemini') 
      ? "I had trouble processing your query. Please try rephrasing it or ask for help to see available options."
      : "An error occurred while processing your request. Please try again or ask for help.";
    
    res.status(500).json({ 
      error: errorMessage,
      data: [],
      message: errorMessage,
      queryType: 'error'
    });
  }
};

// Analytics endpoint for comprehensive system insights
exports.getSystemAnalytics = async (req, res) => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    const analytics = await db.collection("projects").aggregate([
      {
        $group: {
          _id: "$project_details.status",
          count: { $sum: 1 },
          avgProgress: { $avg: "$project_details.progress" }
        }
      }
    ]).toArray();
    
    // Get user statistics
    const userStats = await db.collection("users").aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get task statistics
    const taskStats = await db.collection("tasks").aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    await client.close();
    
    res.json({ 
      projectAnalytics: analytics,
      userStats: userStats,
      taskStats: taskStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Backward compatibility - keep the old function name
exports.handleChat = exports.handleUnifiedChat;
