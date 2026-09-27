import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { employeeService } from '../../services/employeeService';
import {
  Task,
  Project,
  CreateTaskData,
  TaskComment,
  Subtask,
} from '../../types/project';
import { Employee } from '../../types/employee';
import { CustomKanbanStage, INITIAL_KANBAN_STAGES, MOCK_TASKS, MOCK_PROJECTS, MOCK_EMPLOYEES } from '../../data/mockData';
import { TaskCard } from './components/TaskCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { tasksReducer, initialTasksState } from './hooks/tasksReducer';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
import {
  Kanban,
  List,
  Plus,
  Search,
  User,
  Send,
  X,
  Loader2,
  Trash2,
  Edit2,
  MoveLeft,
  MoveRight,
  Sliders,
  Filter,
  Check,
  Link as LinkIcon,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageStages = hasRole(['admin', 'project_manager', 'hr_manager']);

  // ── Core task state (centralized via reducer) ──
  const [state, dispatch] = useReducer(tasksReducer, {
    ...initialTasksState,
    tasks: USE_MOCK_DATA ? MOCK_TASKS : [],
  });
  const { tasks, activeTask, comments, dependencies, blockedTasks, isLoading, error, draggedTaskId, dragOverStageId } = state;

  // ── Reference data ──
  const [projects, setProjects] = useState<Project[]>(USE_MOCK_DATA ? MOCK_PROJECTS : []);
  const [employees, setEmployees] = useState<Employee[]>(USE_MOCK_DATA ? MOCK_EMPLOYEES : []);
  const [stages, setStages] = useState<CustomKanbanStage[]>(INITIAL_KANBAN_STAGES);

  // ── View / filter state ──
  const projectFromUrl = Number(searchParams.get('project'));
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>(
    Number.isInteger(projectFromUrl) && projectFromUrl > 0 ? projectFromUrl : 'all'
  );
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'my-tasks' | 'urgent' | 'due-soon'>('all');

  // ── Modal toggles ──
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState<boolean>(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState<boolean>(false);

  // ── Comment form state ──
  const [newComment, setNewComment] = useState<string>('');
  const [isSendingComment, setIsSendingComment] = useState<boolean>(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  // ── Subtask / dependency form state ──
  const [isAddingSubtask, setIsAddingSubtask] = useState<boolean>(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [isAddingDependency, setIsAddingDependency] = useState<boolean>(false);
  const [selectedDependencyTaskId, setSelectedDependencyTaskId] = useState<number | ''>('');

  // Context menu state
  const [contextMenuTask, setContextMenuTask] = useState<Task | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // New Stage form
  const [newStageName, setNewStageName] = useState<string>('');
  const [newStageColor, setNewStageColor] = useState<string>('#05AD98');

  // Custom Field Form
  const [customFieldName, setCustomFieldName] = useState<string>('');
  const [customFieldValue, setCustomFieldValue] = useState<string>('');

  // Task Form Data
  const [formData, setFormData] = useState<CreateTaskData & { custom_fields?: Record<string, string> }>({
    project_id: undefined,
    title: '',
    description: '',
    assigned_to: undefined,
    priority: 'medium',
    status: 'todo',
    due_date: '',
    custom_fields: {},
  });

  // Helper function to format dates properly
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '—';
    }
  };

  // Fetch real data or fallback to mock data
  const fetchData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const [projData, empData] = await Promise.all([
        projectService.getProjects().catch(() => []),
        employeeService.getEmployees().catch(() => []),
      ]);

      const resolvedProjects = Array.isArray(projData) && projData.length > 0 ? projData : (USE_MOCK_DATA ? MOCK_PROJECTS : []);
      const resolvedEmployees = Array.isArray(empData) && empData.length > 0 ? empData : (USE_MOCK_DATA ? MOCK_EMPLOYEES : []);

      setProjects(resolvedProjects);
      setEmployees(resolvedEmployees);

      const projectIds = selectedProjectId === 'all'
        ? resolvedProjects.map((project) => project.id)
        : [selectedProjectId];
      const taskGroups = await Promise.all(projectIds.map((projectId) => taskService.getTasksByProject(projectId)));
      dispatch({ type: 'SET_TASKS', payload: taskGroups.flat().filter((task, index, allTasks) => allTasks.findIndex((item) => item.id === task.id) === index) });

      if (selectedProjectId === 'all' && resolvedProjects[0]) {
        setFormData((prev) => ({ ...prev, project_id: resolvedProjects[0].id }));
      } else if (typeof selectedProjectId === 'number') {
        setFormData((prev) => ({ ...prev, project_id: selectedProjectId }));
      }
    } catch (err) {
      if (USE_MOCK_DATA) {
        setProjects(MOCK_PROJECTS);
        setEmployees(MOCK_EMPLOYEES);
        dispatch({ type: 'SET_TASKS', payload: MOCK_TASKS });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const nextProjectId = Number(searchParams.get('project'));
    const resolvedProjectId = Number.isInteger(nextProjectId) && nextProjectId > 0 ? nextProjectId : 'all';
    if (resolvedProjectId !== selectedProjectId) {
      setSelectedProjectId(resolvedProjectId);
    }
  }, [searchParams, selectedProjectId]);

  const handleProjectChange = async (projId: number | 'all') => {
    setSelectedProjectId(projId);
    setSearchParams(projId === 'all' ? {} : { project: String(projId) });
  };

  // Drag and drop handlers for tasks
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
    dispatch({ type: 'SET_DRAG_STATE', payload: { draggedTaskId: taskId, dragOverStageId } });
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      dispatch({ type: 'SET_DRAG_STATE', payload: { draggedTaskId, dragOverStageId: stageId } });
    }
  };

  const handleDragLeave = (_e: React.DragEvent, stageId: string) => {
    if (dragOverStageId === stageId) {
      dispatch({ type: 'SET_DRAG_STATE', payload: { draggedTaskId, dragOverStageId: null } });
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAG_STATE', payload: { draggedTaskId, dragOverStageId: null } });
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check dependencies before allowing move to 'done'
    if (targetStageId === 'done') {
      try {
        const depsData = await taskService.getDependencies(taskId);
        const deps = depsData?.dependencies || [];
        
        const hasIncompleteDeps = deps.some(dep => {
          const depTask = tasks.find(t => t.id === dep.depends_on_task_id);
          return depTask && depTask.status !== 'done';
        });
        
        if (hasIncompleteDeps) {
          dispatch({ type: 'SET_ERROR', payload: 'Cannot complete task: There are incomplete dependencies' });
          return;
        }
      } catch (err) {
        console.error('Error checking dependencies:', err);
      }
    }

    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: { status: targetStageId } } });
    setSuccessMessage(`Task moved to stage: ${stages.find((s) => s.id === targetStageId)?.label || targetStageId}`);

    try {
      await taskService.updateTask(taskId, { status: targetStageId });
    } catch {
      // Keep optimistic change locally
    }
    dispatch({ type: 'SET_DRAG_STATE', payload: { draggedTaskId: null, dragOverStageId: null } });
  };

  // Add custom stage
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const stageId = newStageName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (stages.some((s) => s.id === stageId)) {
      dispatch({ type: 'SET_ERROR', payload: 'A stage with a similar name already exists.' });
      return;
    }

    const newStage: CustomKanbanStage = {
      id: stageId,
      label: newStageName.trim(),
      color: newStageColor,
      badgeVariant: 'primary',
    };

    setStages((prev) => [...prev, newStage]);
    setNewStageName('');
    setIsAddStageModalOpen(false);
    setSuccessMessage(`Stage "${newStage.label}" created successfully.`);
  };

  // Move stage left/right
  const handleMoveStage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const updated = [...stages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setStages(updated);
  };

  // Delete custom stage
  const handleDeleteStage = (stageId: string) => {
    if (stages.length <= 1) {
      dispatch({ type: 'SET_ERROR', payload: 'You must keep at least one workflow stage.' });
      return;
    }
    const targetFallback = stages.find((s) => s.id !== stageId)?.id || 'todo';
    // Move tasks in deleted stage to fallback stage
    dispatch({ type: 'SET_TASKS', payload: tasks.map((t) => (t.status === stageId ? { ...t, status: targetFallback } : t)) });
    setStages((prev) => prev.filter((s) => s.id !== stageId));
    setSuccessMessage('Stage removed and remaining tasks reassigned.');
  };

  // Open task creation
  const handleOpenCreate = () => {
    const defaultProjId = typeof selectedProjectId === 'number' ? selectedProjectId : projects[0]?.id;
    setFormData({
      project_id: defaultProjId,
      title: '',
      description: '',
      assigned_to: employees[0]?.id,
      priority: 'medium',
      status: stages[0]?.id || 'todo',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      custom_fields: {},
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.title.trim()) return;

    const assignedEmp = employees.find((emp) => emp.id === formData.assigned_to);

    const newTask: Task = {
      id: Date.now(),
      project_id: formData.project_id,
      title: formData.title.trim(),
      description: formData.description,
      priority: formData.priority || 'medium',
      status: formData.status || 'todo',
      due_date: formData.due_date,
      assigned_to: formData.assigned_to,
      assignee: assignedEmp,
      assigned_employee: assignedEmp,
      custom_fields: formData.custom_fields,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    setSuccessMessage('Task created successfully.');
    setIsCreateModalOpen(false);

    try {
      await taskService.createTask(formData.project_id, formData);
    } catch {
      // Mock data retained
    }
  };

  const handleOpenTaskDetails = async (task: Task) => {
    dispatch({ type: 'SET_ACTIVE_TASK', payload: task });
    setEditingCommentId(null);
    setIsAddingSubtask(false);
    setNewSubtaskTitle('');
    
    try {
      const [comms, deps] = await Promise.all([
        taskService.getComments(task.id),
        taskService.getDependencies(task.id),
      ]);
      
      dispatch({ type: 'SET_COMMENTS', payload: Array.isArray(comms) ? comms : [] });
      dispatch({ type: 'SET_DEPENDENCIES', payload: { dependencies: deps?.dependencies || [], blockedTasks: deps?.blocked_tasks || [] } });
    } catch {
      dispatch({ type: 'SET_COMMENTS', payload: [] });
      dispatch({ type: 'SET_DEPENDENCIES', payload: { dependencies: [], blockedTasks: [] } });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newComment.trim()) return;
    setIsSendingComment(true);

    const mockComment: TaskComment = {
      id: Date.now(),
      task_id: activeTask.id,
      user_id: user?.id || 1,
      body: newComment.trim(),
      user: user || { id: 1, name: 'User', email: 'user@modoo.cm', role: 'admin', created_at: '' },
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COMMENT', payload: mockComment });
    setNewComment('');

    try {
      await taskService.addComment(activeTask.id, newComment.trim());
    } catch {
      // Local state preserved
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!activeTask || !newSubtaskTitle.trim()) return;
    
    try {
      const newSubtask = await taskService.createSubtask(activeTask.id, { title: newSubtaskTitle.trim() });
      dispatch({ type: 'ADD_SUBTASK', payload: newSubtask });
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      setSuccessMessage('Subtask added successfully.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add subtask.' });
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    if (!activeTask) return;
    
    try {
      const updated = await taskService.toggleSubtaskCompletion(subtask.id);
      dispatch({ type: 'TOGGLE_SUBTASK', payload: { subtaskId: updated.id, isCompleted: updated.is_completed } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to toggle subtask.' });
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!activeTask) return;
    
    try {
      await taskService.deleteSubtask(subtaskId);
      dispatch({ type: 'UPDATE_ACTIVE_TASK', payload: {
        subtasks: activeTask.subtasks?.filter(s => s.id !== subtaskId),
      }});
      setSuccessMessage('Subtask deleted.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete subtask.' });
    }
  };

  const handleStartEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.body);
  };

  const handleSaveEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    
    try {
      await taskService.updateComment(commentId, editingCommentText.trim());
      dispatch({ type: 'UPDATE_COMMENT', payload: { id: commentId, body: editingCommentText.trim() } });
      setEditingCommentId(null);
      setEditingCommentText('');
      setSuccessMessage('Comment updated.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update comment.' });
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await taskService.deleteComment(commentId);
      dispatch({ type: 'DELETE_COMMENT', payload: commentId });
      setSuccessMessage('Comment deleted.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete comment.' });
    }
  };

  const handleAddDependency = async () => {
    if (!activeTask || !selectedDependencyTaskId) return;
    
    try {
      const newDependency = await taskService.addDependency(activeTask.id, {
        depends_on_task_id: Number(selectedDependencyTaskId),
      });
      dispatch({ type: 'ADD_DEPENDENCY', payload: newDependency });
      setIsAddingDependency(false);
      setSelectedDependencyTaskId('');
      setSuccessMessage('Dependency added successfully.');
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err?.response?.data?.message || 'Failed to add dependency. Check for circular dependencies.' });
    }
  };

  const handleRemoveDependency = async (dependencyId: number) => {
    try {
      await taskService.removeDependency(dependencyId);
      dispatch({ type: 'REMOVE_DEPENDENCY', payload: dependencyId });
      setSuccessMessage('Dependency removed.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove dependency.' });
    }
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuTask(task);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenuTask(null);
    setContextMenuPosition(null);
  };

  const handleDuplicateTask = async () => {
    if (!contextMenuTask) return;
    const duplicated: CreateTaskData = {
      ...contextMenuTask,
      title: `${contextMenuTask.title} (Copy)`,
      status: 'todo',
    };
    closeContextMenu();
    
    try {
      const newTask = await taskService.createTask(contextMenuTask.project_id, duplicated);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      setSuccessMessage('Task duplicated successfully.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to duplicate task.' });
    }
  };

  const handleArchiveTask = async () => {
    if (!contextMenuTask) return;
    closeContextMenu();
    
    try {
      await taskService.updateTask(contextMenuTask.id, { status: 'archived' } as any);
      dispatch({ type: 'DELETE_TASK', payload: contextMenuTask.id });
      setSuccessMessage('Task archived.');
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to archive task.' });
    }
  };

  useEffect(() => {
    if (contextMenuPosition) {
      const handler = () => closeContextMenu();
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [contextMenuPosition]);

  const handleAddCustomFieldToTask = () => {
    if (!activeTask || !customFieldName.trim()) return;
    const key = customFieldName.trim();
    const val = customFieldValue.trim() || '—';

    const updatedFields = { ...(activeTask.custom_fields || {}), [key]: val };
    dispatch({ type: 'UPDATE_TASK', payload: { id: activeTask.id, updates: { custom_fields: updatedFields } } });
    setCustomFieldName('');
    setCustomFieldValue('');
    setIsCustomFieldModalOpen(false);
    setSuccessMessage(`Custom field "${key}" added to task.`);
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    dispatch({ type: 'DELETE_TASK', payload: id });
    setSuccessMessage('Task removed.');

    try {
      await taskService.deleteTask(id);
    } catch {
      // Local state updated
    }
  };

  // Filtered tasks with quick filters
  const filteredTasks = tasks.filter((task) => {
    const matchesProject =
      selectedProjectId === 'all' || task.project_id === selectedProjectId;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.assignee?.user?.name && task.assignee.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;

    let matchesQuickFilter = true;
    if (activeQuickFilter === 'my-tasks') {
      matchesQuickFilter = task.assigned_to === user?.id;
    } else if (activeQuickFilter === 'urgent') {
      matchesQuickFilter = task.priority === 'urgent' || task.priority === 'high';
    } else if (activeQuickFilter === 'due-soon') {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        matchesQuickFilter = daysUntilDue >= 0 && daysUntilDue <= 7;
      } else {
        matchesQuickFilter = false;
      }
    }

    return matchesProject && matchesSearch && matchesPriority && matchesQuickFilter;
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Tasks</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">
              {selectedProject ? selectedProject.name : 'All Projects'}
            </span>
            <span className="text-xs text-slate-400 font-medium">({filteredTasks.length} tasks)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Task
            </Button>

            {canManageStages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddStageModalOpen(true)}
                leftIcon={<Sliders className="w-3.5 h-3.5 text-[#05AD98]" />}
              >
                Add Stage
              </Button>
            )}

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-auto md:ml-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveQuickFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeQuickFilter === 'all'
                  ? 'bg-[#05AD98] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setActiveQuickFilter('my-tasks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all inline-flex items-center gap-1 ${
                activeQuickFilter === 'my-tasks'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              My Tasks
            </button>
            <button
              onClick={() => setActiveQuickFilter('urgent')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all inline-flex items-center gap-1 ${
                activeQuickFilter === 'urgent'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Urgent
            </button>
            <button
              onClick={() => setActiveQuickFilter('due-soon')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all inline-flex items-center gap-1 ${
                activeQuickFilter === 'due-soon'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Due Soon
            </button>
          </div>

          <div className="w-full sm:w-52 shrink-0">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => dispatch({ type: 'SET_ERROR', payload: null })}
        />
      )}

      {/* Main View Area */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
          <p className="text-xs font-medium">Synchronizing task board...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage, index) => {
              const stageTasks = filteredTasks.filter((t) => t.status === stage.id);
              const isDragOver = dragOverStageId === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`w-72 rounded-xl p-3 border transition-all duration-150 flex flex-col min-h-[550px] group ${
                    isDragOver
                      ? 'border-2 border-dashed border-[#05AD98] bg-[#05AD98]/5 shadow-sm'
                      : 'border-slate-200 bg-gradient-to-b from-slate-50/80 to-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: stage.color || '#05AD98' }}
                      />
                      <span className="text-sm font-bold text-slate-800 tracking-tight">
                        {stage.label}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {stageTasks.length}
                      </span>
                    </div>

                    {canManageStages && (
                      <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveStage(index, 'left')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="Move Stage Left"
                          >
                            <MoveLeft className="w-3 h-3" />
                          </button>
                        )}
                        {index < stages.length - 1 && (
                          <button
                            onClick={() => handleMoveStage(index, 'right')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="Move Stage Right"
                          >
                            <MoveRight className="w-3 h-3" />
                          </button>
                        )}
                        {stages.length > 1 && (
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600"
                            title="Delete Stage"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                    {stageTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        draggedTaskId={draggedTaskId}
                        handleDragStart={handleDragStart}
                        handleOpenTaskDetails={handleOpenTaskDetails}
                        handleContextMenu={handleContextMenu}
                        handleDeleteTask={handleDeleteTask}
                      />
                    ))}

                    {stageTasks.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400">
                        Drag tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {canManageStages && (
              <div
                onClick={() => setIsAddStageModalOpen(true)}
                className="w-72 rounded-xl p-4 border border-dashed border-slate-300 bg-white/60 hover:bg-white hover:border-[#05AD98] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-[#05AD98] min-h-[550px]"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Add New Stage</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Custom Fields</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const stage = stages.find((s) => s.id === task.status);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleOpenTaskDetails(task)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {task.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${stage?.color || '#05AD98'}15`,
                            color: stage?.color || '#05AD98',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: stage?.color || '#05AD98' }}
                          />
                          {stage?.label || task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'danger'
                              : task.priority === 'high'
                              ? 'warning'
                              : task.priority === 'medium'
                              ? 'primary'
                              : 'silver'
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {task.assignee?.user?.name || task.assigned_employee?.user?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {task.due_date || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {task.custom_fields && Object.keys(task.custom_fields).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(task.custom_fields).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        formData={formData}
        setFormData={setFormData}
        projects={projects}
        employees={employees}
        stages={stages}
      />

      {/* ADD STAGE MODAL */}
      {isAddStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Full backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddStageModalOpen(false)} />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Workflow Stage</h3>
              <button
                onClick={() => setIsAddStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStage} className="space-y-4">
              <Input
                label="Stage Name"
                placeholder="e.g. Code Review"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stage Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="h-10 w-20 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">{newStageColor}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAddStageModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Add Stage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS SIDEBAR */}
      {activeTask && (
        <>
          {/* Slide-in animation styles */}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0.5; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeInBackdrop {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-fade-backdrop {
              animation: fadeInBackdrop 0.2s ease-out forwards;
            }
          `}</style>

          {/* Backdrop overlay — click to dismiss */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] animate-fade-backdrop" 
            onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', payload: null })}
          />
          
          {/* Sidebar panel — slides in from right, never full-width */}
          <div className="fixed inset-y-0 right-0 w-[92vw] sm:w-[480px] md:w-[520px] max-w-[520px] bg-white border-l border-slate-200 shadow-2xl z-[110] overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4 flex items-center justify-between z-10">
              <input
                type="text"
                value={activeTask.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  dispatch({ type: 'UPDATE_ACTIVE_TASK', payload: { title: newTitle } });
                }}
                onBlur={async () => {
                  try {
                    await taskService.updateTask(activeTask.id, { title: activeTask.title });
                    setSuccessMessage('Task title updated');
                  } catch {
                    dispatch({ type: 'SET_ERROR', payload: 'Failed to update task title' });
                  }
                }}
                className="font-bold text-base text-slate-900 flex-1 pr-4 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#05AD98] rounded px-2 py-1"
              />
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', payload: null })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          <div className="p-4 space-y-6">
            {/* Task Status & Priority */}
            <div className="flex items-center gap-3">
              <select
                value={activeTask.status}
                onChange={async (e) => {
                  const newSt = e.target.value;
                  
                  // Check if task has incomplete dependencies
                  const hasIncompleteDeps = dependencies.some(dep => {
                    const depTask = tasks.find(t => t.id === dep.depends_on_task_id);
                    return depTask && depTask.status !== 'done';
                  });
                  
                  if (hasIncompleteDeps && newSt === 'done') {
                    dispatch({ type: 'SET_ERROR', payload: 'Cannot complete task: There are incomplete dependencies' });
                    return;
                  }
                  
                  dispatch({ type: 'MOVE_TASK', payload: { taskId: activeTask.id, newStatus: newSt } });
                  taskService.updateTask(activeTask.id, { status: newSt }).catch(() => {});
                }}
                className="text-xs font-semibold rounded-md bg-white border border-slate-300 px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#05AD98]"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>

              <Badge
                variant={
                  activeTask.priority === 'urgent'
                    ? 'danger'
                    : activeTask.priority === 'high'
                    ? 'warning'
                    : activeTask.priority === 'medium'
                    ? 'primary'
                    : 'silver'
                }
              >
                {activeTask.priority}
              </Badge>

              {activeTask.due_date && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(activeTask.due_date)}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Description
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Comments Section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Comments ({comments.length})
              </h4>

              <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-medium">
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{comment.user?.name || 'Unknown User'}</p>
                          <p className="text-[10px] text-slate-500">{formatDateTime(comment.created_at)}</p>
                        </div>
                      </div>
                      {comment.user_id === user?.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditComment(comment)}
                            className="p-1 text-slate-400 hover:text-[#05AD98]"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this comment?')) {
                                handleDeleteComment(comment.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-[#05AD98]"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEditComment(comment.id)}
                            className="text-xs bg-[#05AD98] text-white px-3 py-1 rounded-lg hover:bg-[#048f7f]"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditComment}
                            className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex items-start gap-2">
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-[#05AD98]"
                  disabled={isSendingComment}
                />
                <button
                  type="submit"
                  disabled={isSendingComment || !newComment.trim()}
                  className="p-2 bg-[#05AD98] text-white rounded-lg hover:bg-[#048f7f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send comment"
                >
                  {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Subtasks ({activeTask.subtasks?.length || 0})
                </h4>
                <button
                  onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                  className="text-[10px] font-semibold text-[#05AD98] hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {isAddingSubtask && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title..."
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 mb-2 focus:outline-none focus:border-[#05AD98]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskTitle.trim()}
                      className="text-xs bg-[#05AD98] text-white px-3 py-1.5 rounded-lg hover:bg-[#048f7f] disabled:opacity-50"
                    >
                      Add Subtask
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                      }}
                      className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {activeTask.subtasks && activeTask.subtasks.length > 0 ? (
                  activeTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg group hover:border-[#05AD98]/40 transition-colors">
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          subtask.is_completed
                            ? 'bg-[#05AD98] border-[#05AD98]'
                            : 'border-slate-300 hover:border-[#05AD98]'
                        }`}
                      >
                        {subtask.is_completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 text-xs ${subtask.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Delete this subtask?')) {
                            handleDeleteSubtask(subtask.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-3 border border-dashed border-slate-200 rounded-lg">
                    No subtasks yet
                  </p>
                )}
              </div>
            </div>

            {/* Dependencies Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#05AD98]" />
                  Dependencies
                </h4>
                <button
                  onClick={() => setIsAddingDependency(!isAddingDependency)}
                  className="text-[10px] font-semibold text-[#05AD98] hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* Inline Add Dependency Form */}
              {isAddingDependency && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] text-amber-700 mb-2 font-medium">
                    This task depends on:
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedDependencyTaskId}
                      onChange={(e) => setSelectedDependencyTaskId(Number(e.target.value))}
                      className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#05AD98]"
                    >
                      <option value="">Select a task...</option>
                      {tasks
                        .filter(t => 
                          t.id !== activeTask.id && 
                          t.project_id === activeTask.project_id &&
                          !dependencies.some(d => d.depends_on_task_id === t.id)
                        )
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            #{t.id} - {t.title}
                          </option>
                        ))
                      }
                    </select>
                    <button
                      onClick={handleAddDependency}
                      disabled={!selectedDependencyTaskId}
                      className="p-1.5 bg-[#05AD98] text-white rounded-lg hover:bg-[#048f7f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add dependency"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingDependency(false);
                        setSelectedDependencyTaskId('');
                      }}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[9px] text-amber-600 mt-2 italic">
                    💡 This task cannot start until the selected task is completed
                  </p>
                </div>
              )}

              {dependencies.length > 0 || blockedTasks.length > 0 ? (
                <div className="space-y-2">
                  {dependencies.map((dep) => (
                    <div key={dep.id} className="p-2 bg-white border border-amber-200 rounded-lg text-xs group hover:border-amber-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            Depends on: #{dep.depends_on_task_id}
                          </p>
                          {dep.dependsOnTask && (
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {dep.dependsOnTask.title}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveDependency(dep.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600"
                          title="Remove dependency"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {blockedTasks.map((blockedTask) => (
                    <div key={blockedTask.id} className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            Blocks: #{blockedTask.id}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {blockedTask.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-3 border border-dashed border-slate-200 rounded-lg">
                  No dependencies
                </p>
              )}
            </div>

          </div>
        </div>
        </>
      )}

      {/* CONTEXT MENU */}
      {contextMenuTask && contextMenuPosition && (
        <>
          {/* Full screen backdrop */}
          <div 
            className="fixed inset-0 z-[90]"
            onClick={closeContextMenu}
          />
          
          {/* Context menu */}
          <div
            className="fixed z-[95] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px]"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDuplicateTask}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate Task
            </button>
            <button
              onClick={handleArchiveTask}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive Task
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => {
                closeContextMenu();
                if (contextMenuTask) handleDeleteTask(contextMenuTask.id);
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Task
            </button>
          </div>
        </>
      )}

      {/* CUSTOM FIELD MODAL */}
      {isCustomFieldModalOpen && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Full backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCustomFieldModalOpen(false)} />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Custom Field</h3>
              <button
                onClick={() => setIsCustomFieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Field Name"
                placeholder="e.g. API Version"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                required
              />
              <Input
                label="Field Value"
                placeholder="e.g. v2.1"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setIsCustomFieldModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddCustomFieldToTask}>
                Save Field
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
