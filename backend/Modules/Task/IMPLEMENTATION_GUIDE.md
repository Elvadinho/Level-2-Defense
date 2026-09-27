# Task Module - Implementation Guide

## Overview
This guide explains how to use all the modern PM features in the Task module.

## Feature Locations

### Header Bar Features

```
┌─────────────────────────────────────────────────────────────┐
│ Tasks / Project Name (15 tasks)                             │
│                                                             │
│ [New Task] [Use Template] [Add Stage] [🔲 Kanban] [≡ List] │
└─────────────────────────────────────────────────────────────┘
```

- **New Task**: Create a new task
- **Use Template**: Browse and apply saved templates
- **Add Stage**: Add custom workflow stages (managers only)
- **View Switchers**: Toggle between Kanban and List view

### Quick Filters

```
┌─────────────────────────────────────────────────────────────┐
│ [All Tasks] [👤 My Tasks] [⚠️ Urgent] [⏰ Due Soon]          │
│                                                             │
│ [Project Selector ▼] [Search...] [Priority Filter ▼]        │
└─────────────────────────────────────────────────────────────┘
```

Click any filter chip to instantly filter tasks:
- **All Tasks**: Show everything
- **My Tasks**: Only tasks assigned to you
- **Urgent**: High priority tasks
- **Due Soon**: Tasks due within 7 days

### Task Card (Kanban View)

```
┌─────────────────────────────────────────────────────────────┐
│ ▌[Progress Bar: 2/5 subtasks]                               │
│ ▌                                                           │
│ ▌[🔴 urgent] [⏰ Dec 24]                          [🗑️]       │
│ ▌                                                           │
│ ▌Fix Payment Integration Bug                               │
│ ▌Implement payment reconciliation with bank API...         │
│ ▌                                                           │
│ ▌📋 2/5  💬 3  📎 1                                          │
│ ▌[🏷️ API:v2] [🏷️ critical:yes]                              │
│ ▌                                                           │
│ ▌[JD] John Doe                                    #1234     │
└─────────────────────────────────────────────────────────────┘
 RED BORDER = URGENT TASK
```

**Visual Indicators:**
- **Left Border Color**: Priority (Red=Urgent, Orange=High, Blue=Medium, Gray=Low)
- **Progress Bar**: Subtask completion (green gradient)
- **Avatar Circle**: User initials in colored circle
- **Smart Counters**: Subtasks, comments, attachments
- **Custom Fields**: First 2 shown as tags

**Right-Click Menu:**
```
┌──────────────────────┐
│ 📋 Duplicate Task    │
│ 🏷️ Save as Template  │
│ 📦 Archive Task      │
│ ──────────────────   │
│ 🗑️ Delete Task       │
└──────────────────────┘
```

### Task Details Sidebar

When you click a task card, the details sidebar opens on the right:

```
┌─────────────────────────────────────────────────────────────┐
│ Fix Payment Integration Bug                          [×]    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│ 📝 DESCRIPTION                                              │
│ Implement payment reconciliation with bank API...          │
│                                                             │
│ 💬 COMMENTS (3)                                      [+ Add]│
│ ┌─────────────────────────────────────────────────────┐   │
│ │ John Doe • 2 hours ago                    [✏️] [🗑️]  │   │
│ │ I've started working on this...                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ✅ SUBTASKS (2/5)                                    [+ Add]│
│ ☑ Connect to bank API                                      │
│ ☐ Implement reconciliation logic                           │
│ ☐ Add error handling                                       │
│                                                             │
│ 📎 FILES (1)                                        [Upload]│
│ ┌─────────────────────────────────────────────────────┐   │
│ │  📁 Drag & drop file here                           │   │
│ │     or click "Upload" above (max 10MB)              │   │
│ └─────────────────────────────────────────────────────┘   │
│ api_spec.pdf • 2.5 MB • John Doe           [↓] [🗑️]        │
│                                                             │
│ ⏱️ TIME LOGGED                                        8.5h  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 3h • Dec 20 • API integration • John Doe            │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 🔗 DEPENDENCIES                                      [+ Add]│
│ ⚠️ Blocked by: #1233 - Setup bank credentials              │
│                                                             │
│ 📊 ACTIVITY FEED                            [Show Activity]│
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [JD] Status changed: In Progress → Done • 2h ago    │   │
│ │ [SM] Comment added • 3h ago                         │   │
│ │ [JD] Subtask completed: Connect API • 5h ago        │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Example 1: Using Templates

1. Right-click any task → "Save as Template"
2. Enter template name: "Bug Fix Template"
3. Click "Use Template" button in header
4. Select template and project
5. New task created with same structure

### Example 2: Drag & Drop Files

1. Open task details
2. Drag PDF file from desktop
3. Drop on drop zone (border turns green)
4. File uploads automatically
5. File appears in attachments list

### Example 3: Quick Filtering

1. Click "My Tasks" chip
2. See only your tasks
3. Click "Urgent" chip  
4. See only urgent tasks assigned to you
5. Click "All Tasks" to reset

### Example 4: Task Dependencies

1. Open task details
2. Click "+ Add" in Dependencies section
3. Select blocking task from dropdown
4. Task shows warning until dependency completes

### Example 5: Quick Duplicate

1. Right-click task card
2. Click "Duplicate Task"
3. Copy created in "Todo" stage
4. Edit as needed

## Keyboard Shortcuts (Coming Soon)

- `N` - New task
- `T` - Open templates
- `F` - Focus search
- `?` - Show shortcuts

## Tips & Tricks

1. **Fast Navigation**: Use quick filters instead of search for common views
2. **Bulk Templates**: Save common task patterns as templates
3. **Dependencies**: Use to enforce workflow order
4. **Activity Feed**: Review before stand-ups
5. **Drag & Drop**: Works for both tasks and files
6. **Context Menu**: Right-click for fast actions

## Common Workflows

### Daily Standup Prep
1. Click "My Tasks" filter
2. Review each task
3. Check activity feed for updates
4. Update subtasks

### Sprint Planning
1. Create tasks from templates
2. Set dependencies
3. Assign team members
4. Set due dates

### Bug Tracking
1. Use "Bug Fix Template"
2. Add error logs as attachments
3. Link to related tasks
4. Track time spent

### Feature Development
1. Break into subtasks
2. Add API specs as attachments
3. Set dependencies between tasks
4. Track progress with completion

## Troubleshooting

**Q: File upload fails**
A: Check file size (max 10MB) and internet connection

**Q: Context menu doesn't appear**
A: Make sure to right-click (not left-click) on task card

**Q: Template not showing**
A: Templates only show tasks from their creation, not subtasks

**Q: Can't add dependency**
A: Circular dependencies are prevented by backend

**Q: Activity feed empty**
A: Feed only shows activities after feature was enabled

## Admin Features

### Add Custom Stage
1. Click "Add Stage" button (managers only)
2. Enter stage name and color
3. Stage appears at end of board
4. Use move buttons to reorder
5. Delete unused stages

### Reorder Stages
1. Click ← → buttons on stage header
2. Stage moves left or right
3. Tasks stay in original stage

### Delete Stage
1. Click × button on stage header
2. Confirm deletion
3. Tasks move to first available stage

## API Integration

For custom integrations, see API endpoints in `backend/Modules/Task/routes/api.php`

Key endpoints:
- `GET /api/tasks/{id}/activities` - Activity feed
- `POST /api/templates` - Create template
- `POST /api/tasks/{id}/attachments` - Upload file
- `GET /api/saved-filters` - Saved filters (backend ready)

## Performance Tips

- Use quick filters instead of complex searches
- Close task details when not needed
- Archive old tasks to reduce board clutter
- Templates reduce repetitive task creation

## Security Notes

- File uploads scanned for malware (recommended)
- 10MB file size limit prevents abuse
- Context menu actions require confirmation for destructive operations
- Dependencies prevent circular references

---

For technical details, see `FEATURES.md`  
For implementation summary, see `/TASK_MODULE_SUMMARY.md`
