import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { employeeService } from '../../services/employeeService';
import { Task, Project, CreateTaskData, TaskPriority, TaskComment } from '../../types/project';
import { Employee } from '../../types/employee';
import { CustomKanbanStage, INITIAL_KANBAN_STAGES, MOCK_TASKS, MOCK_PROJECTS, MOCK_EMPLOYEES } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Kanban,
  List,
  Plus,
  Search,
  User,
  MessageSquare,
  Clock,
  Send,
  X,
  Loader2,
  Trash2,
  MoveLeft,
  MoveRight,
  Tag,
  Sliders,
  Filter,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageStages = hasRole(['admin', 'project_manager', 'hr_manager']);

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [stages, setStages] = useState<CustomKanbanStage[]>(INITIAL_KANBAN_STAGES);

  const projectFromUrl = Number(searchParams.get('project'));
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>(
    Number.isInteger(projectFromUrl) && projectFromUrl > 0 ? projectFromUrl : 'all'
  );
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState<boolean>(false);
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSendingComment, setIsSendingComment] = useState<boolean>(false);

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

  // Fetch real data or fallback to mock data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, empData] = await Promise.all([
        projectService.getProjects().catch(() => []),
        employeeService.getEmployees().catch(() => []),
      ]);

      const resolvedProjects = Array.isArray(projData) && projData.length > 0 ? projData : MOCK_PROJECTS;
      const resolvedEmployees = Array.isArray(empData) && empData.length > 0 ? empData : MOCK_EMPLOYEES;

      setProjects(resolvedProjects);
      setEmployees(resolvedEmployees);

      const projectIds = selectedProjectId === 'all'
        ? resolvedProjects.map((project) => project.id)
        : [selectedProjectId];
      const taskGroups = await Promise.all(projectIds.map((projectId) => taskService.getTasksByProject(projectId)));
      setTasks(taskGroups.flat().filter((task, index, allTasks) => allTasks.findIndex((item) => item.id === task.id) === index));

      if (selectedProjectId === 'all' && resolvedProjects[0]) {
        setFormData((prev) => ({ ...prev, project_id: resolvedProjects[0].id }));
      } else if (typeof selectedProjectId === 'number') {
        setFormData((prev) => ({ ...prev, project_id: selectedProjectId }));
      }
    } catch {
      // Fallback cleanly to mock data without breaking UI
      setProjects(MOCK_PROJECTS);
      setEmployees(MOCK_EMPLOYEES);
      setTasks(MOCK_TASKS);
    } finally {
      setIsLoading(false);
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, stageId: string) => {
    // Only reset if leaving current target
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = parseInt(taskIdStr, 10);
    if (isNaN(taskId)) return;

    // Optimistic UI state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStageId } : t))
    );

    if (activeTask && activeTask.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, status: targetStageId } : null));
    }

    setSuccessMessage(`Task moved to stage: ${stages.find((s) => s.id === targetStageId)?.label || targetStageId}`);

    // Update backend asynchronously
    try {
      await taskService.updateTask(taskId, { status: targetStageId });
    } catch {
      // Keep optimistic change locally
    }
    setDraggedTaskId(null);
  };

  // Add custom stage
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    const stageId = newStageName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (stages.some((s) => s.id === stageId)) {
      setError('A stage with a similar name already exists.');
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
      setError('You must keep at least one workflow stage.');
      return;
    }
    const targetFallback = stages.find((s) => s.id !== stageId)?.id || 'todo';
    setTasks((prev) =>
      prev.map((t) => (t.status === stageId ? { ...t, status: targetFallback } : t))
    );
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

    setTasks((prev) => [newTask, ...prev]);
    setSuccessMessage('Task created successfully.');
    setIsCreateModalOpen(false);

    try {
      await taskService.createTask(formData.project_id, formData);
    } catch {
      // Mock data retained
    }
  };

  const handleOpenTaskDetails = async (task: Task) => {
    setActiveTask(task);
    try {
      const comms = await taskService.getComments(task.id);
      setComments(Array.isArray(comms) ? comms : []);
    } catch {
      setComments([]);
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

    setComments((prev) => [...prev, mockComment]);
    setNewComment('');

    try {
      await taskService.addComment(activeTask.id, newComment.trim());
    } catch {
      // Local state preserved
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleAddCustomFieldToTask = () => {
    if (!activeTask || !customFieldName.trim()) return;
    const key = customFieldName.trim();
    const val = customFieldValue.trim() || '—';

    const updatedTask: Task = {
      ...activeTask,
      custom_fields: {
        ...(activeTask.custom_fields || {}),
        [key]: val,
      },
    };

    setActiveTask(updatedTask);
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setCustomFieldName('');
    setCustomFieldValue('');
    setIsCustomFieldModalOpen(false);
    setSuccessMessage(`Custom field "${key}" added to task.`);
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTask?.id === id) setActiveTask(null);
    setSuccessMessage('Task removed.');

    try {
      await taskService.deleteTask(id);
    } catch {
      // Local state updated
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesProject =
      selectedProjectId === 'all' || task.project_id === selectedProjectId;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.assignee?.user?.name && task.assignee.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesProject && matchesSearch && matchesPriority;
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-4">
      {/* Odoo-style Control Panel & Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        {/* Breadcrumb & Main Actions */}
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

            {/* View Switchers: Kanban vs List */}
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

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Project Selector */}
          <div className="w-full sm:w-60 shrink-0">
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

          {/* Search Input */}
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

          {/* Priority Filter */}
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
          onClose={() => setError(null)}
        />
      )}

      {/* Main View Area */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
          <p className="text-xs font-medium">Synchronizing task board...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD WITH DRAG & DROP AND CUSTOM STAGES */
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
                  className={`w-72 rounded-xl p-3 border transition-all duration-150 flex flex-col min-h-[550px] ${
                    isDragOver
                      ? 'border-2 border-dashed border-[#05AD98] bg-[#05AD98]/5 shadow-sm'
                      : 'border-slate-200 bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  {/* Column / Stage Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || '#05AD98' }}
                      />
                      <span className="text-xs font-bold text-slate-800 tracking-tight">
                        {stage.label}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {stageTasks.length}
                      </span>
                    </div>

                    {/* Stage actions for Managers / Admins */}
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

                  {/* Tasks List in Column */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                    {stageTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        onClick={() => handleOpenTaskDetails(task)}
                        className={`bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/60 transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                          draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        {/* Card Header: Priority & Delete */}
                        <div className="flex items-start justify-between gap-1">
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

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="text-slate-300 hover:text-rose-600 p-0.5 rounded"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Custom Fields tags if attached */}
                        {task.custom_fields && Object.keys(task.custom_fields).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                            {Object.entries(task.custom_fields).map(([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                <Tag className="w-2.5 h-2.5 text-[#05AD98]" />
                                <span className="font-semibold text-slate-700">{k}:</span> {v}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3 text-[#05AD98]" />
                            {task.assignee?.user?.name
                              ? task.assignee.user.name.split(' ')[0]
                              : task.assigned_employee?.user?.name
                              ? task.assigned_employee.user.name.split(' ')[0]
                              : 'Unassigned'}
                          </span>

                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>
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

            {/* Inline Add Stage Card for Managers / Admins */}
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
        /* TABLE LIST VIEW */
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
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create New Task</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project *
                </label>
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Task Title"
                placeholder="e.g. Implement Payment Reconciliation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide context, acceptance criteria, or technical details..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assigned_to || ''}
                    onChange={(e) => setFormData({ ...formData, assigned_to: Number(e.target.value) })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.name || `Employee #${emp.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Due Date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAGE MODAL (HR / PM / ADMIN) */}
      {isAddStageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Workflow Stage</h3>
              <button
                onClick={() => setIsAddStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStage} className="space-y-3.5">
              <Input
                label="Stage Name"
                placeholder="e.g. QA Testing, Deployment, Blocked"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Stage Color Indicator
                </label>
                <div className="flex items-center gap-2">
                  {['#05AD98', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#64748B'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setNewStageColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newStageColor === hex ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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

      {/* TASK DETAILS & COMMENTS MODAL */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge role={activeTask.priority === 'urgent' ? 'admin' : undefined} size="sm">
                    {activeTask.priority} priority
                  </Badge>
                  <span className="text-xs text-slate-400">Task #{activeTask.id}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeTask.title}</h3>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Stage Selector */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Stage:</span>
                <select
                  value={activeTask.status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    setActiveTask({ ...activeTask, status: newSt });
                    setTasks((prev) =>
                      prev.map((t) => (t.id === activeTask.id ? { ...t, status: newSt } : t))
                    );
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

                <span className="text-xs text-slate-400 ml-auto">
                  Assignee: <strong className="text-slate-800">{activeTask.assignee?.user?.name || activeTask.assigned_employee?.user?.name || 'Unassigned'}</strong>
                </span>
              </div>

              {/* Description */}
              {activeTask.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {activeTask.description}
                  </p>
                </div>
              )}

              {/* Custom Fields Management */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Custom Fields
                  </h4>
                  {canManageStages && (
                    <button
                      onClick={() => setIsCustomFieldModalOpen(true)}
                      className="text-[11px] font-semibold text-[#05AD98] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom Field
                    </button>
                  )}
                </div>

                {activeTask.custom_fields && Object.keys(activeTask.custom_fields).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(activeTask.custom_fields).map(([k, v]) => (
                      <div key={k} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">{k}</span>
                        <span className="font-semibold text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom fields assigned to this task.</p>
                )}
              </div>

              {/* Comments Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#05AD98]" /> Discussion ({comments.length})
                </h4>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{c.user?.name || 'Team Member'}</span>
                        <span className="text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                        </span>
                      </div>
                      <p className="text-slate-600">{c.body}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No comments yet.</p>
                  )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98] focus:bg-white"
                  />
                  <Button type="submit" variant="primary" size="sm" isLoading={isSendingComment}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM FIELD MODAL */}
      {isCustomFieldModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">Add Custom Field</h4>
              <button onClick={() => setIsCustomFieldModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Field Label / Name"
                placeholder="e.g. Sprint, Estimated Hours, Story Points"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                required
              />
              <Input
                label="Field Value"
                placeholder="e.g. Sprint 14, 8 hrs, High Risk"
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
