# Task Module - Modern PM Features

This document describes all the modern project management features implemented in the Task module.

## ✅ Implemented Features

### 1. **Quick Filters** 
Filter tasks instantly with preset filter chips:
- **All Tasks** - Show all tasks
- **My Tasks** - Show only tasks assigned to you
- **Urgent** - Show urgent and high priority tasks
- **Due Soon** - Show tasks due within 7 days

**Location**: Top of task board, below search bar

### 2. **Visual Hierarchy**
Enhanced task cards with visual indicators:
- **Colored Left Borders** - Priority indication (Red=Urgent, Orange=High, Blue=Medium, Gray=Low)
- **Progress Bars** - Subtask completion shown at top of card
- **Avatar Circles** - User initials in colored circles
- **Smart Counters** - Subtasks, comments, and attachments count
- **Completion Highlight** - Green text when all subtasks complete

**Location**: All kanban cards and list view

### 3. **Activity Feed**
Track all changes to a task:
- Who made changes
- What was changed
- When changes occurred
- Toggle show/hide in task details

**Backend**: Logs activities automatically for:
- Status changes
- Assignee changes
- Priority changes
- Comments added
- Attachments uploaded
- Subtasks completed

**Location**: Task details sidebar, bottom section

### 4. **Drag & Drop File Upload**
Upload files by dragging into drop zone:
- Visual feedback when dragging
- 10MB file size limit
- Multiple file types supported
- Upload progress indicator
- Download and delete files

**Location**: Task details sidebar, Attachments section

### 5. **Task Templates**
Save and reuse task configurations:
- **Save as Template** - Right-click any task → "Save as Template"
- **Use Template** - Click "Use Template" button → Select project
- Templates include title, description, priority, and custom fields
- View all saved templates in modal

**Location**: 
- Right-click context menu → "Save as Template"
- Header button → "Use Template"

### 6. **Quick Actions Context Menu**
Right-click any task card for quick actions:
- **Duplicate Task** - Create a copy in "Todo" stage
- **Save as Template** - Save task configuration
- **Archive Task** - Archive without deleting
- **Delete Task** - Permanent deletion

**Location**: Right-click on any task card

### 7. **Enhanced Task Details**
Comprehensive task management:
- **Subtasks** - Inline form, track completion with progress bar
- **Comments** - Add, edit, delete with timestamps
- **Attachments** - Upload, download, delete files with drag & drop
- **Time Logs** - View logged hours and descriptions
- **Dependencies** - Block tasks until dependencies complete
- **Custom Fields** - Add flexible metadata tags

**Location**: Click any task card to open details sidebar

### 8. **Custom Workflow Stages**
Create and manage workflow stages:
- Add custom stages with colors
- Reorder stages (move left/right)
- Delete unused stages
- Drag tasks between stages

**Location**: "Add Stage" button (managers/admins only)

## 🚧 Planned Features (Not Yet Implemented)

### Sprint/Milestone View
Group tasks by sprint with burndown charts

### Timeline/Gantt View
Visual timeline showing task durations and dependencies

### Saved Filters
Save custom filter combinations for quick access

## Backend API Endpoints

All endpoints are in `backend/Modules/Task/routes/api.php`

### Activities
- `GET /api/tasks/{taskId}/activities` - Get task activities

### Templates
- `POST /api/tasks/{taskId}/template` - Create template from task
- `GET /api/templates` - Get all templates
- `POST /api/templates/{templateId}/apply` - Apply template to project

### Comments
- `GET /api/tasks/{taskId}/comments` - Get comments
- `POST /api/tasks/{taskId}/comments` - Add comment
- `PUT /api/comments/{commentId}` - Update comment
- `DELETE /api/comments/{commentId}` - Delete comment

### Subtasks
- `POST /api/tasks/{taskId}/subtasks` - Create subtask
- `PUT /api/subtasks/{subtaskId}/toggle` - Toggle completion
- `DELETE /api/subtasks/{subtaskId}` - Delete subtask

### Attachments
- `POST /api/tasks/{taskId}/attachments` - Upload file
- `GET /api/tasks/{taskId}/attachments` - Get attachments
- `DELETE /api/attachments/{attachmentId}` - Delete attachment

### Dependencies
- `POST /api/tasks/{taskId}/dependencies` - Add dependency
- `GET /api/tasks/{taskId}/dependencies` - Get dependencies
- `DELETE /api/dependencies/{dependencyId}` - Remove dependency

### Time Logs
- `GET /api/tasks/{taskId}/time-logs` - Get time logs
- `POST /api/tasks/{taskId}/time-logs` - Log time

## Database Tables

All migrations in `backend/Modules/Task/database/migrations/`

- `task_activities` - Activity log
- `task_templates` - Saved templates
- `task_comments` - Comments with edit/delete
- `subtasks` - Subtasks with completion tracking
- `task_attachments` - File uploads
- `task_dependencies` - Task blocking relationships
- `task_time_logs` - Time tracking entries
- `saved_filters` - Saved filter configurations (backend ready)

## Usage Tips

1. **Quick Filters**: Use filter chips for common views instead of complex searches
2. **Context Menu**: Right-click tasks for quick actions like duplicate or archive
3. **Templates**: Save frequently used task patterns as templates
4. **Activity Feed**: Click "Show Activity" to see full change history
5. **Drag & Drop**: Drop files directly on the drop zone in attachments section
6. **Dependencies**: Tasks with unmet dependencies show warning in details

## Technical Notes

- All backend services in `TaskService.php`
- Frontend state managed in `TasksPage.tsx`
- Date formatting handled by helper functions (formatDate, formatTime, formatDateTime)
- Drag & drop uses HTML5 Drag API
- Context menu closes on click outside
- File uploads limited to 10MB
- Circular dependencies prevented in backend
