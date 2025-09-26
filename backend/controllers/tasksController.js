const Task = require('../models/Task');
const Project = require('../models/Project');

// ✅ Create a new task
exports.createTask = async (req, res) => {    
    try {
        const { project_id, epic_id, title, description, assigned_to, start_date, due_date, priority,status } = req.body;

        // Check for required fields
        if (!project_id || !title || !req.user || !req.user._id) {
            return res.status(400).json({ success: false, message: 'Project ID, title, and created_by are required' });
        }

        const newTask = new Task({
            project_id,
            epic_id,
            title,
            description,
            assigned_to: Array.isArray(assigned_to) ? assigned_to : [assigned_to],
            created_by: req.user._id,
            start_date: start_date ? new Date(start_date) : null,
            due_date: due_date ? new Date(due_date) : null,
            priority,
            status
        });

        await newTask.save();

        // Update the project with the new task reference
        if (epic_id) {
            await Project.findByIdAndUpdate(project_id, {
                $push: { "kanban.epics.$[epic].tasks": { task_id: newTask._id } }
            }, { arrayFilters: [{ "epic._id": epic_id }] });
        }

        res.status(201).json({ success: true, message: 'Task created successfully', task: newTask });

    } catch (error) {
        console.error('Error creating task:', error.message); 
        res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
    }
};

// ✅ Get all tasks of a project
exports.getProjectTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ project_id: req.params.projectId }).populate('assigned_to', 'name email');
        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
    }
};

// ✅ Update a task by ID
// exports. updateTask = async (req, res) => {
//     try {
//         const { title, description, assigned_to, due_date, priority, status, progress } = req.body;
//         const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, { title, description, assigned_to, due_date, priority, status, progress }, { new: true });
//         if (!updatedTask) {
//             return res.status(404).json({ success: false, message: 'Task not found' });
//         }
//         res.status(200).json({ success: true, message: 'Task updated successfully', task: updatedTask });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
//     }
// };

exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const updateData = req.body;

        // Ensure that updateData is not empty
        if (!Object.keys(updateData).length) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        // Update only the fields that are passed in the request body
        const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

        if (!updatedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
    }
};

// ✅ Delete a task by ID
exports.deleteTask = async (req, res) => {
    try {
        const { projectId, epicId } = req.body;

        // Find and delete the task
        const deletedTask = await Task.findByIdAndDelete(req.params.taskId);

        if (!deletedTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // If the task belongs to an epic, remove the task reference from the epic
        if (projectId && epicId) {
            await Project.updateOne(
                { _id: projectId, "kanban.epics.epic_id": epicId },
                { $pull: { "kanban.epics.$.tasks": { task_id: req.params.taskId } } }
            );
        }

        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error.message);
        res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
    }
};


console.log("Exported Functions:", {
    createTask: typeof exports.createTask,
    getProjectTasks: typeof exports.getProjectTasks,
    updateTask: typeof exports.updateTask,
    deleteTask: typeof exports.deleteTask,
});



// module.exports = {
//     createTask,
//     getProjectTasks,
//     updateTask,
//     deleteTask,
// };

