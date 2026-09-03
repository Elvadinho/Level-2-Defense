<?php

namespace Modules\AIAssistant\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Modules\Authentication\Enums\Role;
use Modules\Attendance\Enums\AttendanceStatus;
use Modules\Attendance\Models\Attendance;
use Modules\Customer\Models\Customer;
use Modules\Employee\Enums\EmploymentStatus;
use Modules\Employee\Models\Department;
use Modules\Employee\Models\Employee;
use Modules\Project\Enums\ProjectStatus;
use Modules\Project\Models\Project;
use Modules\Task\Enums\TaskPriority;
use Modules\Task\Enums\TaskStatus;
use Modules\Task\Models\Task;

class AssistantActionExecutor
{
    /**
     * List of sensitive actions requiring explicit confirmation.
     */
    protected array $sensitiveActions = [
        'delete_user',
        'delete_employee',
        'delete_task',
        'delete_project',
        'delete_department',
        'delete_customer',
    ];

    /**
     * Check if an action is categorized as sensitive.
     */
    public function isSensitive(string $actionName): bool
    {
        return in_array($actionName, $this->sensitiveActions, true);
    }

    /**
     * Get list of all available actions supported by the Assistant.
     */
    public function getAvailableActions(): array
    {
        return [
            'create_task' => [
                'description' => 'Create a new task in a project',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER, Role::PROJECT_MANAGER, Role::EMPLOYEE],
                'params' => [
                    'project_id' => 'int (required)',
                    'title' => 'string (required)',
                    'description' => 'string (optional)',
                    'status' => 'string: todo|in_progress|in_review|done (optional, default: todo)',
                    'priority' => 'string: low|medium|high|urgent (optional, default: medium)',
                    'assigned_to' => 'int: employee ID (optional)',
                    'due_date' => 'string: YYYY-MM-DD (optional)',
                ],
            ],
            'update_task_status' => [
                'description' => 'Change status of an existing task',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER, Role::PROJECT_MANAGER, Role::EMPLOYEE],
                'params' => [
                    'task_id' => 'int (required)',
                    'status' => 'string: todo|in_progress|in_review|done (required)',
                ],
            ],
            'update_task' => [
                'description' => 'Update details of an existing task',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER, Role::PROJECT_MANAGER, Role::EMPLOYEE],
                'params' => [
                    'task_id' => 'int (required)',
                    'title' => 'string (optional)',
                    'description' => 'string (optional)',
                    'status' => 'string: todo|in_progress|in_review|done (optional)',
                    'priority' => 'string: low|medium|high|urgent (optional)',
                    'assigned_to' => 'int: employee ID (optional)',
                    'due_date' => 'string: YYYY-MM-DD (optional)',
                ],
            ],
            'delete_task' => [
                'description' => 'Permanently delete a task',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN, Role::PROJECT_MANAGER],
                'params' => [
                    'task_id' => 'int (required)',
                ],
            ],
            'add_task_comment' => [
                'description' => 'Add a comment to a task',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER, Role::PROJECT_MANAGER, Role::EMPLOYEE],
                'params' => [
                    'task_id' => 'int (required)',
                    'comment' => 'string (required)',
                ],
            ],
            'create_project' => [
                'description' => 'Create a new project',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::PROJECT_MANAGER],
                'params' => [
                    'name' => 'string (required)',
                    'description' => 'string (optional)',
                    'status' => 'string: planning|in_progress|on_hold|completed|cancelled (optional)',
                    'start_date' => 'string: YYYY-MM-DD (optional)',
                    'end_date' => 'string: YYYY-MM-DD (optional)',
                    'manager_id' => 'int: employee ID (optional)',
                    'customer_id' => 'int: customer ID (optional)',
                ],
            ],
            'update_project_status' => [
                'description' => 'Change the status of a project',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::PROJECT_MANAGER],
                'params' => [
                    'project_id' => 'int (required)',
                    'status' => 'string: planning|in_progress|on_hold|completed|cancelled (required)',
                ],
            ],
            'delete_project' => [
                'description' => 'Permanently delete a project and its tasks',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN],
                'params' => [
                    'project_id' => 'int (required)',
                ],
            ],
            'create_department' => [
                'description' => 'Create a new department',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER],
                'params' => [
                    'name' => 'string (required)',
                    'description' => 'string (optional)',
                ],
            ],
            'delete_department' => [
                'description' => 'Delete an existing department',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN],
                'params' => [
                    'department_id' => 'int (required)',
                ],
            ],
            'create_employee' => [
                'description' => 'Create a new employee and user account',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER],
                'params' => [
                    'name' => 'string (required)',
                    'email' => 'string (required)',
                    'department_id' => 'int (required)',
                    'job_title' => 'string (required)',
                    'role' => 'string (optional, default: employee)',
                    'hire_date' => 'string: YYYY-MM-DD (optional, default: today)',
                    'employment_status' => 'string: active|inactive|on_leave|terminated (optional, default: active)',
                ],
            ],
            'delete_employee' => [
                'description' => 'Permanently delete an employee profile',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER],
                'params' => [
                    'employee_id' => 'int (required)',
                ],
            ],
            'delete_user' => [
                'description' => 'Permanently delete a user account and linked profile',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN],
                'params' => [
                    'user_id' => 'int (required)',
                ],
            ],
            'create_customer' => [
                'description' => 'Create a new customer profile',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::PROJECT_MANAGER, Role::ACCOUNTANT],
                'params' => [
                    'company_name' => 'string (required)',
                    'contact_name' => 'string (optional)',
                    'email' => 'string (optional)',
                    'phone' => 'string (optional)',
                    'city' => 'string (optional)',
                    'country' => 'string (optional)',
                ],
            ],
            'delete_customer' => [
                'description' => 'Permanently delete a customer',
                'sensitive' => true,
                'allowed_roles' => [Role::ADMIN],
                'params' => [
                    'customer_id' => 'int (required)',
                ],
            ],
            'log_attendance' => [
                'description' => 'Log an attendance record',
                'sensitive' => false,
                'allowed_roles' => [Role::ADMIN, Role::HR_MANAGER, Role::EMPLOYEE],
                'params' => [
                    'employee_id' => 'int (optional, defaults to current employee)',
                    'date' => 'string: YYYY-MM-DD (optional, default: today)',
                    'status' => 'string: present|absent|late|half_day (optional, default: present)',
                    'check_in_time' => 'string: HH:MM:SS (optional)',
                    'check_out_time' => 'string: HH:MM:SS (optional)',
                ],
            ],
        ];
    }

    /**
     * Check if user has the role permission to execute an action.
     */
    public function canUserExecute(User $user, string $actionName): bool
    {
        $actions = $this->getAvailableActions();
        if (!isset($actions[$actionName])) {
            return false;
        }

        $allowedRoles = $actions[$actionName]['allowed_roles'];
        return in_array($user->role, $allowedRoles, true);
    }

    /**
     * Prepare confirmation payload and check prerequisites for sensitive action.
     */
    public function prepareSensitiveAction(User $user, string $actionName, array $params): array
    {
        if (!$this->canUserExecute($user, $actionName)) {
            return [
                'allowed' => false,
                'error' => "You do not have permission to perform '{$actionName}'. Your role is '{$user->role?->value}'.",
            ];
        }

        $targetSummary = '';

        switch ($actionName) {
            case 'delete_user':
                $userId = $params['user_id'] ?? $params['id'] ?? null;
                $targetUser = $userId ? User::find($userId) : null;
                if (!$targetUser) {
                    return ['allowed' => false, 'error' => "User ID {$userId} was not found."];
                }
                $targetSummary = "User '{$targetUser->name}' (Email: {$targetUser->email}, Role: {$targetUser->role?->value}, ID: {$targetUser->id})";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to permanently delete {$targetSummary}? This will permanently remove the account and linked data. This action cannot be undone.";
                break;

            case 'delete_employee':
                $empId = $params['employee_id'] ?? $params['id'] ?? null;
                $targetEmp = $empId ? Employee::with('user')->find($empId) : null;
                if (!$targetEmp) {
                    return ['allowed' => false, 'error' => "Employee ID {$empId} was not found."];
                }
                $name = $targetEmp->user?->name ?? 'Unknown';
                $targetSummary = "Employee '{$name}' (Job Title: {$targetEmp->job_title}, ID: {$targetEmp->id})";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to permanently delete {$targetSummary}? This action cannot be undone.";
                break;

            case 'delete_task':
                $taskId = $params['task_id'] ?? $params['id'] ?? null;
                $targetTask = $taskId ? Task::with('project')->find($taskId) : null;
                if (!$targetTask) {
                    return ['allowed' => false, 'error' => "Task ID {$taskId} was not found."];
                }
                $projectName = $targetTask->project?->name ?? 'N/A';
                $targetSummary = "Task '{$targetTask->title}' (ID: {$targetTask->id}, Project: '{$projectName}')";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to permanently delete {$targetSummary}? This action cannot be undone.";
                break;

            case 'delete_project':
                $projId = $params['project_id'] ?? $params['id'] ?? null;
                $targetProj = $projId ? Project::find($projId) : null;
                if (!$targetProj) {
                    return ['allowed' => false, 'error' => "Project ID {$projId} was not found."];
                }
                $targetSummary = "Project '{$targetProj->name}' (ID: {$targetProj->id})";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to permanently delete {$targetSummary} and its associated tasks? This action cannot be undone.";
                break;

            case 'delete_department':
                $deptId = $params['department_id'] ?? $params['id'] ?? null;
                $targetDept = $deptId ? Department::find($deptId) : null;
                if (!$targetDept) {
                    return ['allowed' => false, 'error' => "Department ID {$deptId} was not found."];
                }
                $targetSummary = "Department '{$targetDept->name}' (ID: {$targetDept->id})";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to delete {$targetSummary}? This action cannot be undone.";
                break;

            case 'delete_customer':
                $custId = $params['customer_id'] ?? $params['id'] ?? null;
                $targetCust = $custId ? Customer::find($custId) : null;
                if (!$targetCust) {
                    return ['allowed' => false, 'error' => "Customer ID {$custId} was not found."];
                }
                $targetSummary = "Customer '{$targetCust->company_name}' (ID: {$targetCust->id})";
                $message = "⚠️ **Confirmation Required**: Are you sure you want to permanently delete {$targetSummary}? This action cannot be undone.";
                break;

            default:
                $message = "⚠️ **Confirmation Required**: Are you sure you want to proceed with action '{$actionName}'?";
                break;
        }

        return [
            'allowed' => true,
            'action' => $actionName,
            'params' => $params,
            'target_summary' => $targetSummary,
            'confirmation_message' => $message,
        ];
    }

    /**
     * Execute an action.
     */
    public function execute(string $actionName, array $params, User $user): array
    {
        if (!$this->canUserExecute($user, $actionName)) {
            return [
                'success' => false,
                'action' => $actionName,
                'error' => "Permission denied: Role '{$user->role?->value}' is not allowed to execute '{$actionName}'.",
            ];
        }

        try {
            return match ($actionName) {
                'create_task' => $this->handleCreateTask($params, $user),
                'update_task_status' => $this->handleUpdateTaskStatus($params, $user),
                'update_task' => $this->handleUpdateTask($params, $user),
                'delete_task' => $this->handleDeleteTask($params, $user),
                'add_task_comment' => $this->handleAddTaskComment($params, $user),
                'create_project' => $this->handleCreateProject($params, $user),
                'update_project_status' => $this->handleUpdateProjectStatus($params, $user),
                'delete_project' => $this->handleDeleteProject($params, $user),
                'create_department' => $this->handleCreateDepartment($params, $user),
                'delete_department' => $this->handleDeleteDepartment($params, $user),
                'create_employee' => $this->handleCreateEmployee($params, $user),
                'delete_employee' => $this->handleDeleteEmployee($params, $user),
                'delete_user' => $this->handleDeleteUser($params, $user),
                'create_customer' => $this->handleCreateCustomer($params, $user),
                'delete_customer' => $this->handleDeleteCustomer($params, $user),
                'log_attendance' => $this->handleLogAttendance($params, $user),
                default => [
                    'success' => false,
                    'action' => $actionName,
                    'error' => "Unknown action '{$actionName}'.",
                ],
            };
        } catch (\Throwable $e) {
            Log::error("Failed executing AI action '{$actionName}'", [
                'params' => $params,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'action' => $actionName,
                'error' => "Execution error: " . $e->getMessage(),
            ];
        }
    }

    // --- Action Handlers ---

    protected function handleCreateTask(array $params, User $user): array
    {
        $projectId = $params['project_id'] ?? null;
        if (!$projectId && !empty($params['project_name'])) {
            $proj = Project::where('name', 'like', "%{$params['project_name']}%")->first();
            $projectId = $proj?->id;
        }

        if (!$projectId || !Project::where('id', $projectId)->exists()) {
            return ['success' => false, 'error' => "Valid 'project_id' is required to create a task."];
        }

        if (empty($params['title'])) {
            return ['success' => false, 'error' => "Task 'title' is required."];
        }

        // Resolve assigned employee if given by name
        $assignedTo = $params['assigned_to'] ?? $params['assignee_id'] ?? null;
        if (!$assignedTo && !empty($params['assignee_name'])) {
            $emp = Employee::whereHas('user', function ($q) use ($params) {
                $q->where('name', 'like', "%{$params['assignee_name']}%");
            })->first();
            $assignedTo = $emp?->id;
        }

        // Validate status enum
        $statusVal = $params['status'] ?? 'todo';
        $statusEnum = TaskStatus::tryFrom($statusVal) ?? TaskStatus::TODO;

        // Validate priority enum
        $priorityVal = $params['priority'] ?? 'medium';
        $priorityEnum = TaskPriority::tryFrom($priorityVal) ?? TaskPriority::MEDIUM;

        $task = Task::create([
            'project_id' => $projectId,
            'title' => $params['title'],
            'description' => $params['description'] ?? null,
            'status' => $statusEnum,
            'priority' => $priorityEnum,
            'assigned_to' => $assignedTo,
            'due_date' => $params['due_date'] ?? null,
        ]);

        $task->load(['project:id,name', 'assignee.user:id,name']);

        return [
            'success' => true,
            'action' => 'create_task',
            'message' => "Task '{$task->title}' (ID: {$task->id}) was successfully created under project '{$task->project?->name}'.",
            'data' => [
                'task' => $task,
            ],
        ];
    }

    protected function handleUpdateTaskStatus(array $params, User $user): array
    {
        $taskId = $params['task_id'] ?? $params['id'] ?? null;
        $task = $taskId ? Task::find($taskId) : null;

        if (!$task) {
            return ['success' => false, 'error' => "Task with ID {$taskId} not found."];
        }

        $newStatus = $params['status'] ?? null;
        if (!$newStatus) {
            return ['success' => false, 'error' => "Target 'status' is required (todo, in_progress, in_review, done)."];
        }

        $enum = TaskStatus::tryFrom(strtolower($newStatus));
        if (!$enum) {
            return ['success' => false, 'error' => "Invalid task status '{$newStatus}'. Allowed: todo, in_progress, in_review, done."];
        }

        $oldStatus = $task->status?->value ?? $task->status;
        $task->status = $enum;
        $task->save();
        $task->load(['project:id,name', 'assignee.user:id,name']);

        return [
            'success' => true,
            'action' => 'update_task_status',
            'message' => "Task '{$task->title}' (ID: {$task->id}) status updated from '{$oldStatus}' to '{$enum->value}'.",
            'data' => [
                'task' => $task,
                'old_status' => $oldStatus,
                'new_status' => $enum->value,
            ],
        ];
    }

    protected function handleUpdateTask(array $params, User $user): array
    {
        $taskId = $params['task_id'] ?? $params['id'] ?? null;
        $task = $taskId ? Task::find($taskId) : null;

        if (!$task) {
            return ['success' => false, 'error' => "Task with ID {$taskId} not found."];
        }

        if (isset($params['title'])) {
            $task->title = $params['title'];
        }
        if (isset($params['description'])) {
            $task->description = $params['description'];
        }
        if (isset($params['status'])) {
            $enum = TaskStatus::tryFrom(strtolower($params['status']));
            if ($enum) {
                $task->status = $enum;
            }
        }
        if (isset($params['priority'])) {
            $pEnum = TaskPriority::tryFrom(strtolower($params['priority']));
            if ($pEnum) {
                $task->priority = $pEnum;
            }
        }
        if (isset($params['due_date'])) {
            $task->due_date = $params['due_date'];
        }
        if (isset($params['assigned_to'])) {
            $task->assigned_to = $params['assigned_to'];
        }

        $task->save();
        $task->load(['project:id,name', 'assignee.user:id,name']);

        return [
            'success' => true,
            'action' => 'update_task',
            'message' => "Task '{$task->title}' (ID: {$task->id}) details updated successfully.",
            'data' => [
                'task' => $task,
            ],
        ];
    }

    protected function handleDeleteTask(array $params, User $user): array
    {
        $taskId = $params['task_id'] ?? $params['id'] ?? null;
        $task = $taskId ? Task::find($taskId) : null;

        if (!$task) {
            return ['success' => false, 'error' => "Task with ID {$taskId} not found."];
        }

        $title = $task->title;
        $id = $task->id;
        $task->delete();

        return [
            'success' => true,
            'action' => 'delete_task',
            'message' => "Task '{$title}' (ID: {$id}) was deleted successfully.",
            'data' => [
                'deleted_task_id' => $id,
                'deleted_task_title' => $title,
            ],
        ];
    }

    protected function handleAddTaskComment(array $params, User $user): array
    {
        $taskId = $params['task_id'] ?? $params['id'] ?? null;
        $task = $taskId ? Task::find($taskId) : null;

        if (!$task) {
            return ['success' => false, 'error' => "Task with ID {$taskId} not found."];
        }

        $commentBody = $params['comment'] ?? $params['body'] ?? null;
        if (!$commentBody) {
            return ['success' => false, 'error' => "Comment text is required."];
        }

        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'body' => $commentBody,
        ]);
        $comment->load('user:id,name,email');

        return [
            'success' => true,
            'action' => 'add_task_comment',
            'message' => "Comment added to task '{$task->title}' (ID: {$task->id}).",
            'data' => [
                'comment' => $comment,
            ],
        ];
    }

    protected function handleCreateProject(array $params, User $user): array
    {
        if (empty($params['name'])) {
            return ['success' => false, 'error' => "Project 'name' is required."];
        }

        $statusVal = $params['status'] ?? 'planning';
        $statusEnum = ProjectStatus::tryFrom($statusVal) ?? ProjectStatus::PLANNING;

        $managerId = $params['manager_id'] ?? $user->employee?->id ?? Employee::first()?->id;

        if (!$managerId) {
            return ['success' => false, 'error' => "A project manager (employee) is required to create a project."];
        }

        $project = Project::create([
            'name' => $params['name'],
            'description' => $params['description'] ?? null,
            'status' => $statusEnum,
            'start_date' => $params['start_date'] ?? null,
            'end_date' => $params['end_date'] ?? null,
            'manager_id' => $managerId,
            'customer_id' => $params['customer_id'] ?? null,
        ]);

        return [
            'success' => true,
            'action' => 'create_project',
            'message' => "Project '{$project->name}' (ID: {$project->id}) was created successfully.",
            'data' => [
                'project' => $project,
            ],
        ];
    }

    protected function handleUpdateProjectStatus(array $params, User $user): array
    {
        $projId = $params['project_id'] ?? $params['id'] ?? null;
        $project = $projId ? Project::find($projId) : null;

        if (!$project) {
            return ['success' => false, 'error' => "Project ID {$projId} not found."];
        }

        $newStatus = $params['status'] ?? null;
        $enum = ProjectStatus::tryFrom(strtolower($newStatus));
        if (!$enum) {
            return ['success' => false, 'error' => "Invalid project status '{$newStatus}'. Allowed: planning, in_progress, on_hold, completed, cancelled."];
        }

        $oldStatus = $project->status?->value ?? $project->status;
        $project->status = $enum;
        $project->save();

        return [
            'success' => true,
            'action' => 'update_project_status',
            'message' => "Project '{$project->name}' status updated from '{$oldStatus}' to '{$enum->value}'.",
            'data' => [
                'project' => $project,
                'old_status' => $oldStatus,
                'new_status' => $enum->value,
            ],
        ];
    }

    protected function handleDeleteProject(array $params, User $user): array
    {
        $projId = $params['project_id'] ?? $params['id'] ?? null;
        $project = $projId ? Project::find($projId) : null;

        if (!$project) {
            return ['success' => false, 'error' => "Project ID {$projId} not found."];
        }

        $name = $project->name;
        $id = $project->id;
        $project->delete();

        return [
            'success' => true,
            'action' => 'delete_project',
            'message' => "Project '{$name}' (ID: {$id}) and its related tasks were deleted successfully.",
            'data' => [
                'deleted_project_id' => $id,
                'deleted_project_name' => $name,
            ],
        ];
    }

    protected function handleCreateDepartment(array $params, User $user): array
    {
        if (empty($params['name'])) {
            return ['success' => false, 'error' => "Department 'name' is required."];
        }

        $department = Department::create([
            'name' => $params['name'],
            'description' => $params['description'] ?? null,
        ]);

        return [
            'success' => true,
            'action' => 'create_department',
            'message' => "Department '{$department->name}' (ID: {$department->id}) was created successfully.",
            'data' => [
                'department' => $department,
            ],
        ];
    }

    protected function handleDeleteDepartment(array $params, User $user): array
    {
        $deptId = $params['department_id'] ?? $params['id'] ?? null;
        $department = $deptId ? Department::find($deptId) : null;

        if (!$department) {
            return ['success' => false, 'error' => "Department ID {$deptId} not found."];
        }

        $name = $department->name;
        $id = $department->id;
        $department->delete();

        return [
            'success' => true,
            'action' => 'delete_department',
            'message' => "Department '{$name}' (ID: {$id}) was deleted successfully.",
            'data' => [
                'deleted_department_id' => $id,
                'deleted_department_name' => $name,
            ],
        ];
    }

    protected function handleCreateEmployee(array $params, User $user): array
    {
        return DB::transaction(function () use ($params) {
            $userId = $params['user_id'] ?? null;

            if (!$userId) {
                if (empty($params['name']) || empty($params['email'])) {
                    return ['success' => false, 'error' => "Either 'user_id' or ('name' and 'email') are required to create an employee."];
                }

                $roleVal = $params['role'] ?? 'employee';
                $roleEnum = Role::tryFrom($roleVal) ?? Role::EMPLOYEE;

                $user = User::firstOrCreate(
                    ['email' => $params['email']],
                    [
                        'name' => $params['name'],
                        'password' => Hash::make($params['password'] ?? 'Password123!'),
                        'role' => $roleEnum,
                    ]
                );
                $userId = $user->id;
            }

            $deptId = $params['department_id'] ?? null;
            if (!$deptId && !empty($params['department_name'])) {
                $dept = Department::where('name', 'like', "%{$params['department_name']}%")->first();
                $deptId = $dept?->id;
            }

            if (!$deptId) {
                return ['success' => false, 'error' => "Valid 'department_id' is required for creating an employee."];
            }

            $empStatus = $params['employment_status'] ?? 'active';
            $statusEnum = EmploymentStatus::tryFrom($empStatus) ?? EmploymentStatus::ACTIVE;

            $employee = Employee::create([
                'user_id' => $userId,
                'department_id' => $deptId,
                'job_title' => $params['job_title'] ?? 'Staff',
                'employment_status' => $statusEnum,
                'hire_date' => $params['hire_date'] ?? now()->toDateString(),
            ]);

            $employee->load(['user:id,name,email,role', 'department:id,name']);

            return [
                'success' => true,
                'action' => 'create_employee',
                'message' => "Employee '{$employee->user?->name}' (ID: {$employee->id}, {$employee->job_title}) was created successfully in {$employee->department?->name}.",
                'data' => [
                    'employee' => $employee,
                ],
            ];
        });
    }

    protected function handleDeleteEmployee(array $params, User $user): array
    {
        $empId = $params['employee_id'] ?? $params['id'] ?? null;
        $employee = $empId ? Employee::with('user')->find($empId) : null;

        if (!$employee) {
            return ['success' => false, 'error' => "Employee ID {$empId} not found."];
        }

        $name = $employee->user?->name ?? "Employee #{$employee->id}";
        $id = $employee->id;
        $employee->delete();

        return [
            'success' => true,
            'action' => 'delete_employee',
            'message' => "Employee '{$name}' (ID: {$id}) was deleted successfully.",
            'data' => [
                'deleted_employee_id' => $id,
                'deleted_employee_name' => $name,
            ],
        ];
    }

    protected function handleDeleteUser(array $params, User $user): array
    {
        $userId = $params['user_id'] ?? $params['id'] ?? null;
        $targetUser = $userId ? User::find($userId) : null;

        if (!$targetUser) {
            return ['success' => false, 'error' => "User ID {$userId} not found."];
        }

        $name = $targetUser->name;
        $email = $targetUser->email;
        $id = $targetUser->id;

        $targetUser->delete();

        return [
            'success' => true,
            'action' => 'delete_user',
            'message' => "User '{$name}' ({$email}, ID: {$id}) was permanently deleted.",
            'data' => [
                'deleted_user_id' => $id,
                'deleted_user_name' => $name,
                'deleted_user_email' => $email,
            ],
        ];
    }

    protected function handleCreateCustomer(array $params, User $user): array
    {
        if (empty($params['company_name'])) {
            return ['success' => false, 'error' => "Customer 'company_name' is required."];
        }

        $customer = Customer::create([
            'company_name' => $params['company_name'],
            'contact_name' => $params['contact_name'] ?? null,
            'email' => $params['email'] ?? null,
            'phone' => $params['phone'] ?? null,
            'address' => $params['address'] ?? null,
            'city' => $params['city'] ?? null,
            'country' => $params['country'] ?? null,
        ]);

        return [
            'success' => true,
            'action' => 'create_customer',
            'message' => "Customer '{$customer->company_name}' (ID: {$customer->id}) was created successfully.",
            'data' => [
                'customer' => $customer,
            ],
        ];
    }

    protected function handleDeleteCustomer(array $params, User $user): array
    {
        $custId = $params['customer_id'] ?? $params['id'] ?? null;
        $customer = $custId ? Customer::find($custId) : null;

        if (!$customer) {
            return ['success' => false, 'error' => "Customer ID {$custId} not found."];
        }

        $name = $customer->company_name;
        $id = $customer->id;
        $customer->delete();

        return [
            'success' => true,
            'action' => 'delete_customer',
            'message' => "Customer '{$name}' (ID: {$id}) was deleted successfully.",
            'data' => [
                'deleted_customer_id' => $id,
                'deleted_customer_name' => $name,
            ],
        ];
    }

    protected function handleLogAttendance(array $params, User $user): array
    {
        $empId = $params['employee_id'] ?? $user->employee?->id ?? null;
        if (!$empId) {
            return ['success' => false, 'error' => "Employee ID could not be determined for attendance logging."];
        }

        $statusVal = $params['status'] ?? 'present';
        $statusEnum = AttendanceStatus::tryFrom($statusVal) ?? AttendanceStatus::PRESENT;

        $attendance = Attendance::create([
            'employee_id' => $empId,
            'date' => $params['date'] ?? now()->toDateString(),
            'status' => $statusEnum,
            'check_in_time' => $params['check_in_time'] ?? now()->toTimeString(),
            'check_out_time' => $params['check_out_time'] ?? null,
        ]);

        $attendance->load('employee.user:id,name');

        return [
            'success' => true,
            'action' => 'log_attendance',
            'message' => "Attendance for '{$attendance->employee?->user?->name}' on {$attendance->date->toDateString()} logged as '{$statusEnum->value}'.",
            'data' => [
                'attendance' => $attendance,
            ],
        ];
    }
}
