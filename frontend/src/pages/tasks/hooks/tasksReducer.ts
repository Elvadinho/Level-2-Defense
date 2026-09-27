import { Task, TaskComment, TaskDependency, Subtask } from '../../../types/project';

export interface TasksState {
  tasks: Task[];
  activeTask: Task | null;
  comments: TaskComment[];
  dependencies: TaskDependency[];
  blockedTasks: Task[];
  isLoading: boolean;
  error: string | null;
  draggedTaskId: number | null;
  dragOverStageId: string | null;
}

export const initialTasksState: TasksState = {
  tasks: [],
  activeTask: null,
  comments: [],
  dependencies: [],
  blockedTasks: [],
  isLoading: false,
  error: null,
  draggedTaskId: null,
  dragOverStageId: null,
};

export type TasksAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: number; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: number }
  | { type: 'SET_ACTIVE_TASK'; payload: Task | null }
  | { type: 'UPDATE_ACTIVE_TASK'; payload: Partial<Task> }
  | { type: 'SET_COMMENTS'; payload: TaskComment[] }
  | { type: 'ADD_COMMENT'; payload: TaskComment }
  | { type: 'UPDATE_COMMENT'; payload: { id: number; body: string } }
  | { type: 'DELETE_COMMENT'; payload: number }
  | { type: 'ADD_SUBTASK'; payload: Subtask }
  | { type: 'TOGGLE_SUBTASK'; payload: { subtaskId: number; isCompleted: boolean } }
  | { type: 'SET_DEPENDENCIES'; payload: { dependencies: TaskDependency[]; blockedTasks: Task[] } }
  | { type: 'ADD_DEPENDENCY'; payload: TaskDependency }
  | { type: 'REMOVE_DEPENDENCY'; payload: number }
  | { type: 'SET_DRAG_STATE'; payload: { draggedTaskId: number | null; dragOverStageId: string | null } }
  | { type: 'MOVE_TASK'; payload: { taskId: number; newStatus: string } };

export const tasksReducer = (state: TasksState, action: TasksAction): TasksState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload.updates } : t)),
        activeTask: state.activeTask?.id === action.payload.id ? { ...state.activeTask, ...action.payload.updates } : state.activeTask,
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
        activeTask: state.activeTask?.id === action.payload ? null : state.activeTask,
      };
    
    case 'SET_ACTIVE_TASK':
      return { 
        ...state, 
        activeTask: action.payload,
        comments: [],
        dependencies: [],
        blockedTasks: [],
      };
    
    case 'UPDATE_ACTIVE_TASK':
      if (!state.activeTask) return state;
      const updatedTask = { ...state.activeTask, ...action.payload };
      return {
        ...state,
        activeTask: updatedTask,
        tasks: state.tasks.map((t) => (t.id === state.activeTask?.id ? updatedTask : t)),
      };
    
    case 'SET_COMMENTS':
      return { ...state, comments: action.payload };
    
    case 'ADD_COMMENT':
      return { ...state, comments: [...state.comments, action.payload] };
    
    case 'UPDATE_COMMENT':
      return {
        ...state,
        comments: state.comments.map((c) => (c.id === action.payload.id ? { ...c, body: action.payload.body } : c)),
      };
    
    case 'DELETE_COMMENT':
      return { ...state, comments: state.comments.filter((c) => c.id !== action.payload) };
    
    case 'ADD_SUBTASK':
      if (!state.activeTask) return state;
      return {
        ...state,
        activeTask: {
          ...state.activeTask,
          subtasks: [...(state.activeTask.subtasks || []), action.payload],
        },
      };
    
    case 'TOGGLE_SUBTASK':
      if (!state.activeTask) return state;
      return {
        ...state,
        activeTask: {
          ...state.activeTask,
          subtasks: (state.activeTask.subtasks || []).map((s) =>
            s.id === action.payload.subtaskId ? { ...s, is_completed: action.payload.isCompleted } : s
          ),
        },
      };
    
    case 'SET_DEPENDENCIES':
      return {
        ...state,
        dependencies: action.payload.dependencies,
        blockedTasks: action.payload.blockedTasks,
      };
    
    case 'ADD_DEPENDENCY':
      return { ...state, dependencies: [...state.dependencies, action.payload] };
    
    case 'REMOVE_DEPENDENCY':
      return { ...state, dependencies: state.dependencies.filter((d) => d.id !== action.payload) };
    
    case 'SET_DRAG_STATE':
      return {
        ...state,
        draggedTaskId: action.payload.draggedTaskId,
        dragOverStageId: action.payload.dragOverStageId,
      };
    
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.taskId ? { ...t, status: action.payload.newStatus } : t)),
        activeTask: state.activeTask?.id === action.payload.taskId ? { ...state.activeTask, status: action.payload.newStatus } : state.activeTask,
        draggedTaskId: null,
        dragOverStageId: null,
      };
    
    default:
      return state;
  }
};
