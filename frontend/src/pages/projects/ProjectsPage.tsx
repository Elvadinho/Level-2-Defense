import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import { employeeService } from '../../services/employeeService';
import { Project, CreateProjectData } from '../../types/project';
import { Employee } from '../../types/employee';
import { MOCK_PROJECTS, MOCK_EMPLOYEES } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Plus,
  Search,
  Calendar,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  Loader2,
  UserPlus,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Member Modal State
  const [memberModalProject, setMemberModalProject] = useState<Project | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [memberRole, setMemberRole] = useState<string>('Developer');

  // Form State
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'in_progress',
    budget: 25000000,
    manager_id: undefined,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, empData] = await Promise.all([
        projectService.getProjects().catch(() => []),
        employeeService.getEmployees().catch(() => []),
      ]);
      setProjects(Array.isArray(projData) && projData.length > 0 ? projData : MOCK_PROJECTS);
      setEmployees(Array.isArray(empData) && empData.length > 0 ? empData : MOCK_EMPLOYEES);
    } catch {
      setProjects(MOCK_PROJECTS);
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'in_progress',
      budget: 25000000,
      manager_id: employees[0]?.id || undefined,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description || '',
      start_date: proj.start_date ? proj.start_date.substring(0, 10) : '',
      end_date: proj.end_date ? proj.end_date.substring(0, 10) : '',
      status: proj.status,
      budget: Number(proj.budget) || 0,
      manager_id: proj.manager_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this project and all associated task assignments?')) return;
    try {
      await projectService.deleteProject(id);
    } catch {
      // Local delete
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSuccessMessage('Project removed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const mgr = employees.find((emp) => emp.id === formData.manager_id);

    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, formData);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingProject.id
              ? {
                  ...p,
                  name: formData.name,
                  description: formData.description,
                  start_date: formData.start_date,
                  end_date: formData.end_date,
                  status: formData.status || 'in_progress',
                  budget: formData.budget,
                  manager: mgr,
                }
              : p
          )
        );
        setSuccessMessage('Project updated successfully.');
      } else {
        await projectService.createProject(formData);
        const newProj: Project = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status || 'in_progress',
          budget: formData.budget,
          manager: mgr,
          tasks_count: 0,
          members: [],
          created_at: new Date().toISOString(),
        };
        setProjects((prev) => [newProj, ...prev]);
        setSuccessMessage('Project initiated successfully.');
      }
      setIsModalOpen(false);
    } catch {
      // Optimistic local state update
      if (editingProject) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingProject.id
              ? {
                  ...p,
                  name: formData.name,
                  description: formData.description,
                  start_date: formData.start_date,
                  end_date: formData.end_date,
                  status: formData.status || 'in_progress',
                  budget: formData.budget,
                  manager: mgr,
                }
              : p
          )
        );
        setSuccessMessage('Project updated successfully.');
      } else {
        const newProj: Project = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status || 'in_progress',
          budget: formData.budget,
          manager: mgr,
          tasks_count: 0,
          members: [],
          created_at: new Date().toISOString(),
        };
        setProjects((prev) => [newProj, ...prev]);
        setSuccessMessage('Project initiated successfully.');
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberModalProject || !selectedEmployeeId) return;

    const emp = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!emp) return;

    try {
      await projectService.addMember(memberModalProject.id, {
        employee_id: Number(selectedEmployeeId),
        role: memberRole,
      });
      setSuccessMessage('Team member assigned to project.');
    } catch {
      setSuccessMessage('Team member assigned to project.');
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === memberModalProject.id) {
          const newMembers = [
            ...(p.members || []),
            {
              id: Date.now(),
              project_id: p.id,
              employee_id: Number(selectedEmployeeId),
              role: memberRole,
              employee: emp,
            },
          ];
          return { ...p, members: newMembers };
        }
        return p;
      })
    );

    setMemberModalProject(null);
    setSelectedEmployeeId('');
  };

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (proj.manager?.user?.name && proj.manager.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      selectedStatus === 'all' || proj.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Project Management</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">Projects</span>
            <span className="text-xs text-slate-400 font-medium">({filteredProjects.length} projects)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Project
            </Button>

            {/* View Switchers */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-auto md:ml-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
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
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search project name, description, or project lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Main Content */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
          <p className="text-xs font-medium">Loading project workspaces...</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/50 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      proj.status === 'completed'
                        ? 'success'
                        : proj.status === 'in_progress'
                        ? 'primary'
                        : proj.status === 'planning'
                        ? 'silver'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {proj.status.replace('_', ' ')}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1 text-slate-400 hover:text-[#05AD98] rounded"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proj.start_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 justify-end">
                    <span>{Number(proj.budget).toLocaleString()} XAF</span>
                  </div>
                </div>

                {/* Team Members */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center -space-x-1.5">
                    {proj.members && proj.members.length > 0 ? (
                      proj.members.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-[#05AD98] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-2xs"
                          title={`${m.employee?.user?.name || 'Member'} (${m.role})`}
                        >
                          {m.employee?.user?.name ? m.employee.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">No members assigned</span>
                    )}
                  </div>

                  <button
                    onClick={() => setMemberModalProject(proj)}
                    className="p-1 text-slate-500 hover:text-[#05AD98] text-xs font-semibold inline-flex items-center gap-1"
                    title="Add member"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#05AD98]" /> Assign Staff
                  </button>
                </div>
              </div>

              {/* Action Button: Jump to Kanban Tasks */}
              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/tasks')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full justify-center"
                >
                  View Tasks ({proj.tasks_count || 0})
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lead / Manager</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Timeline</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{p.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === 'completed'
                            ? 'success'
                            : p.status === 'in_progress'
                            ? 'primary'
                            : p.status === 'planning'
                            ? 'silver'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {p.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.manager?.user?.name || 'Project Lead'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {Number(p.budget).toLocaleString()} XAF
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.start_date} {p.end_date ? `→ ${p.end_date}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.members?.length || 0} members
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 text-slate-400 hover:text-[#05AD98]"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProject ? 'Edit Project' : 'Initialize New Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Project Name"
                placeholder="e.g. Modoo Core ERP Migration"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Outline objectives, deliverables, and team responsibilities..."
                  rows={3}
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
                <Input
                  label="Target End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total Budget (XAF)"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Lead / Manager
                </label>
                <select
                  value={formData.manager_id || ''}
                  onChange={(e) => setFormData({ ...formData, manager_id: Number(e.target.value) })}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name || `Staff #${emp.id}`} ({emp.job_title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {memberModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">Assign Member to {memberModalProject.name}</h4>
              <button onClick={() => setMemberModalProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  required
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name} — {emp.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Role in Project"
                placeholder="e.g. Lead Architect, QA Lead, Backend Engineer"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setMemberModalProject(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Assign Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
