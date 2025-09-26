const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Client = require("../models/Client");
const callGeminiAPI = require("../utils/geminiApi");

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Database collection names for reference
const COLLECTIONS = {
  USERS: "users",
  PROJECTS: "projects",
  TASKS: "tasks",
  CLIENTS: "clients"
};

/**
 * Get examples for different collections to use in the prompt
 * @param {string} collection - The collection name
 * @returns {string} - Examples for the specified collection
 */
function getExamplesForCollection(collection) {
  const examples = {
    [COLLECTIONS.USERS]: `
"Find users who know React and Python" => 
{ "filter": { "skills": { "$all": ["React", "Python"] } }, "fields": ["name", "skills", "email"] }

"Show active users from Mumbai who speak English" => 
{ "filter": { 
    "$and": [
      { "status": "active" },
      { "address": /Mumbai/i },
      { "preferences.languages": "English" }
    ]
  }, 
  "fields": ["name", "email", "address", "preferences.languages", "status"] 
}
`,
    [COLLECTIONS.PROJECTS]: `
"Find high priority projects that are in progress" => 
{ "filter": { 
    "$and": [
      { "priority": "high" },
      { "status": "in-progress" }
    ]
  }, 
  "fields": ["name", "description", "status", "priority", "end_date"] 
}

"Show projects ending next month" => 
{ "filter": { 
    "end_date": { 
      "$gte": "2023-06-01", 
      "$lt": "2023-07-01" 
    }
  }, 
  "fields": ["name", "description", "client", "end_date", "status"] 
}
`,
    [COLLECTIONS.TASKS]: `
"Find high priority tasks assigned to John" => 
{ "filter": { 
    "$and": [
      { "priority": "high" },
      { "assignee.name": /John/i }
    ]
  }, 
  "fields": ["title", "description", "status", "priority", "due_date", "assignee"] 
}

"Show tasks due this week that are not completed" => 
{ "filter": { 
    "$and": [
      { "due_date": { "$gte": "2023-05-22", "$lte": "2023-05-28" } },
      { "status": { "$ne": "done" } }
    ]
  }, 
  "fields": ["title", "status", "priority", "due_date", "assignee"] 
}
`,
    [COLLECTIONS.CLIENTS]: `
"Find active clients with projects" => 
{ "filter": { 
    "$and": [
      { "status": "active" },
      { "projects": { "$exists": true, "$ne": [] } }
    ]
  }, 
  "fields": ["name", "email", "contact_person", "status", "projects"] 
}

"Show clients from New York" => 
{ "filter": { "address": /New York/i }, 
  "fields": ["name", "contact_person", "address", "email", "phone"] 
}
`
  };

  return examples[collection] || examples[COLLECTIONS.USERS];
}


async function convertToMongoQuery(userInput, collection = COLLECTIONS.USERS) {
  // Define schemas for different collections
  const schemas = {
    [COLLECTIONS.USERS]: `
- name: String
- email: String (unique)
- contact_number: String
- address: String
- skills: [String]
- profile_picture.url: String
- profile_picture.upload_date: Date
- preferences.languages: [String]
- status: String (enum: ['active', 'inactive'])
- additional_fields: Map<String>
    `,
    [COLLECTIONS.PROJECTS]: `
- name: String
- description: String
- client: ObjectId (reference to Client)
- start_date: Date
- end_date: Date
- status: String (enum: ['planning', 'in-progress', 'completed', 'on-hold'])
- team_members: [ObjectId] (references to User)
- budget: Number
- priority: String (enum: ['low', 'medium', 'high'])
    `,
    [COLLECTIONS.TASKS]: `
- title: String
- description: String
- project: ObjectId (reference to Project)
- assignee: ObjectId (reference to User)
- status: String (enum: ['todo', 'in-progress', 'review', 'done'])
- priority: String (enum: ['low', 'medium', 'high'])
- due_date: Date
- created_at: Date
    `,
    [COLLECTIONS.CLIENTS]: `
- name: String
- email: String
- contact_person: String
- phone: String
- address: String
- status: String (enum: ['active', 'inactive'])
- projects: [ObjectId] (references to Project)
    `
  };

  // Get the schema for the specified collection
  const schema = schemas[collection] || schemas[COLLECTIONS.USERS];

  const prompt = `
You are an AI converting natural language into MongoDB filters and field selection.

Schema for ${collection}:
${schema}

Return a JSON object with two properties:
1. filter: MongoDB filter object (support multiple conditions and regex)
2. fields: Array of field names to return

Handle these query patterns:
- Comparison: "older than", "more than", "less than", "before", "after"
- Text search: "contains", "like", "about", "related to"
- Status: "active", "completed", "in progress", "on hold", "todo", "done"
- Priority: "high priority", "medium priority", "low priority"
- Dates: "this month", "last week", "next month", "due soon"
- Combinations: "active projects with high priority due next month"

Examples for ${collection === COLLECTIONS.USERS ? 'users' : collection}:
${getExamplesForCollection(collection)}

Only return the JSON object:
"${userInput}"
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const json = response.match(/{[\s\S]*}/)?.[0];
  
  // Default query if parsing fails
  const defaultQuery = {
    filter: {},
    fields: ["name", "email", "contact_number", "address", "skills", "profile_picture", "preferences.languages", "status"]
  };

  try {
    return json ? JSON.parse(json) : defaultQuery;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return defaultQuery;
  }
}

async function queryMongoose(collection, filter, fields) {
  let model;
  
  // Select the appropriate Mongoose model based on collection name
  switch(collection) {
    case COLLECTIONS.USERS:
      model = User;
      break;
    case COLLECTIONS.PROJECTS:
      model = Project;
      break;
    case COLLECTIONS.TASKS:
      model = Task;
      break;
    case COLLECTIONS.CLIENTS:
      model = Client;
      break;
    default:
      model = User; // Default to User model
  }
  
  // Convert fields array to MongoDB projection object
  const projection = fields.reduce((acc, field) => {
    switch(field) {
      case 'languages':
        acc['preferences.languages'] = 1;
        break;
      case 'profile_picture':
        acc['profile_picture.url'] = 1;
        acc['profile_picture.upload_date'] = 1;
        break;
      case 'contact_number':
        acc['contact_number'] = 1;
        break;
      case 'address':
        acc['address'] = 1;
        break;
      case 'skills':
        acc['skills'] = 1;
        break;
      case 'status':
        acc['status'] = 1;
        break;
      default:
        acc[field] = 1;
    }
    return acc;
  }, {});
  
  // Use Mongoose to query the database
  const result = await model.find(filter, projection).limit(10).lean();
  return result;
}

async function summarizeWithGemini(data, userQuery, fields) {
  const cleaned = data.map(user => {
    const result = {};
    fields.forEach(field => {
      switch(field) {
        case 'languages':
          result[field] = user.preferences?.languages || [];
          break;
        case 'profile_picture':
          result[field] = {
            url: user.profile_picture?.url || null,
            upload_date: user.profile_picture?.upload_date || null
          };
          break;
        case 'skills':
          result[field] = Array.isArray(user.skills) ? user.skills : [];
          break;
        default:
          result[field] = user[field] || null;
      }
    });
    return result;
  });

  const prompt = `
You're a helpful assistant. Based on this user query:
"${userQuery}"

Analyze and return the most relevant data based on the query context.
Consider:
1. Query intent and relevance
2. Data completeness
3. Natural ordering (e.g., alphabetical for names, recent first for dates)
4. Remove duplicates and invalid entries

Return a JSON array with only these requested fields: ${fields.join(', ')}
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

/**
 * Determine which collection to query based on user input
 * @param {string} userInput - The user's query
 * @returns {string} - The collection name to query
 */
function determineCollection(userInput) {
  const input = userInput.toLowerCase();
  
  if (input.includes('project') || input.includes('projects')) {
    return COLLECTIONS.PROJECTS;
  } else if (input.includes('task') || input.includes('tasks')) {
    return COLLECTIONS.TASKS;
  } else if (input.includes('client') || input.includes('clients')) {
    return COLLECTIONS.CLIENTS;
  } else {
    // Default to users collection
    return COLLECTIONS.USERS;
  }
}

/**
 * Handle general queries that don't require database access
 * @param {string} userInput - The user's query
 * @returns {Object|null} - Response object or null if not a general query
 */
async function handleGeneralQuery(userInput) {
  const input = userInput.toLowerCase();
  
  // Check if this is a general question about the system
  if (input.includes('help') || input.includes('what can you do')) {
    return {
      data: [],
      message: "I can help you find information about users, projects, tasks, and clients in the WorkFusion system. Try asking questions like 'Find active users who know React' or 'Show me projects with deadline this month'."
    };
  }
  
  // Check if this is a greeting
  if (input.match(/^(hi|hello|hey|greetings).{0,10}$/i)) {
    return {
      data: [],
      message: "Hello! I'm your WorkFusion assistant. How can I help you today?"
    };
  }
  
  return null; // Not a general query
}

exports.handleChat = async (req, res) => {
  try {
    const userInput = req.body.message;
    
    // First check if this is a general query
    const generalResponse = await handleGeneralQuery(userInput);
    if (generalResponse) {
      return res.json(generalResponse);
    }
    
    // Determine which collection to query
    const collection = determineCollection(userInput);
    
    // Convert user input to MongoDB query
     const { filter, fields } = await convertToMongoQuery(userInput, collection);
    
    // Query the database
    const results = await queryMongoose(collection, filter, fields);

    if (results.length === 0) {
      // If no results, try to give a helpful response using Gemini
      const aiResponse = await callGeminiAPI(
        `The user asked: "${userInput}", but no matching data was found in the ${collection} collection. Provide a helpful response.`
      );
      
      return res.json({ 
        data: [], 
        message: aiResponse || `No matching ${collection} found.` 
      });
    }

    // Summarize results with Gemini
    const data = await summarizeWithGemini(results, userInput, fields);
    
    res.json({ 
      data, 
      message: `Found ${data.length} matching ${collection} with fields: ${fields.join(', ')}.` 
    });
  } catch (err) {
    console.error('Error in handleChat:', err);
    res.status(500).json({ 
      error: err.message,
      message: "Sorry, I encountered an error processing your request. Please try again later."
    });
  }
};
