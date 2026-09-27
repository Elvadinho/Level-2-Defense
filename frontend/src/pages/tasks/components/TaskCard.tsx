import React from 'react';
import { Task } from '../../../types/project';
import { Badge } from '../../../components/common/Badge';
import { Calendar, Trash2, Check, MessageSquare, Paperclip } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  draggedTaskId: number | null;
  handleDragStart: (e: React.DragEvent, taskId: number) => void;
  handleOpenTaskDetails: (task: Task) => void;
  handleContextMenu: (e: React.MouseEvent, task: Task) => void;
  handleDeleteTask: (taskId: number) => void;
}

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

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  draggedTaskId,
  handleDragStart,
  handleOpenTaskDetails,
  handleContextMenu,
  handleDeleteTask,
}) => {
  return (
    <div
      draggable={true}
      onDragStart={(e) => handleDragStart(e, task.id)}
      onClick={() => handleOpenTaskDetails(task)}
      onContextMenu={(e) => handleContextMenu(e, task)}
      className={`bg-white rounded-lg p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group relative ${
        draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
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
          {task.due_date && (
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTask(task.id);
          }}
          className="text-slate-300 hover:text-rose-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <h4 className="font-semibold text-xs text-slate-900 leading-snug mb-1">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {(task.subtasks || task.attachments || task.comments) && (
        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
            </span>
          )}
          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {task.comments.length}
            </span>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              {task.attachments.length}
            </span>
          )}
        </div>
      )}

      {task.custom_fields && Object.keys(task.custom_fields).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {Object.entries(task.custom_fields).slice(0, 3).map(([k, v]) => (
            <span
              key={k}
              className="text-[10px] px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-200"
            >
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-medium">
            {task.assignee?.user?.name
              ? task.assignee.user.name.charAt(0).toUpperCase()
              : task.assigned_employee?.user?.name
              ? task.assigned_employee.user.name.charAt(0).toUpperCase()
              : '?'}
          </div>
          <span className="text-xs text-slate-700">
            {task.assignee?.user?.name
              ? task.assignee.user.name.split(' ')[0]
              : task.assigned_employee?.user?.name
              ? task.assigned_employee.user.name.split(' ')[0]
              : 'Unassigned'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400">#{task.id}</span>
      </div>
    </div>
  );
};
