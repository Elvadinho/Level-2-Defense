<?php

namespace Modules\AIAssistant\Services;

use Illuminate\Support\Facades\Log;
use App\Models\User;
use Modules\AIAssistant\Contracts\AiProviderInterface;
use Modules\Authentication\Enums\Role;
use Modules\Employee\Models\Employee;
use Modules\Employee\Models\Department;
use Modules\Project\Models\Project;
use Modules\Task\Models\Task;
use Modules\Attendance\Models\Attendance;
use Modules\Customer\Models\Customer;
use Modules\Invoice\Models\Invoice;
use Modules\Payment\Models\Payment;
use Modules\Quotation\Models\Quotation;

class AssistantService
{
    private AiProviderInterface $aiProvider;

    public function __construct(?AiProviderInterface $aiProvider = null)
    {
        $this->aiProvider = $aiProvider ?? app(AiProviderInterface::class);
    }

    /**
     * Get the AI provider instance.
     */
    public function getAiProvider(): AiProviderInterface
    {
        return $this->aiProvider;
    }

    /**
     * Build the structured messages array for the LLM.
     *
     * Returns an array of role/content messages (system + user)
     * following the OpenAI-compatible chat format.
     */
    public function buildMessages(User $user, string $userInput): array
    {
        $currentDate = now()->toDayDateTimeString();
        $erpContext = $this->buildErpContext($user, $userInput);

        $systemPrompt = <<<SYSTEM
        You are Modoo AI — the intelligent ERP assistant and action executor embedded in Modoo ERP.
        You help employees understand real ERP data, answer questions, and perform authorized business actions.

        Current Date & Time: {$currentDate}

        IMPORTANT INSTRUCTIONS:
        1. Base your answers strictly on the REAL ERP DATABASE CONTEXT provided below.
        2. NEVER hallucinate, invent, assume, or fabricate fake employees, projects, tasks, attendances, customers, or numbers that do not exist in the provided database context.
        3. If the user asks for a list or information (e.g. "tell me all the employees", "list tasks", "show projects"), return all the matching records from the database context accurately and completely with "intent": "query".
        4. If the user wants to perform an action (e.g. create task, change task status, update task, delete user, delete task, add comment, create project, create department, log attendance), set "intent": "action".
        5. Always respond with ONLY valid JSON — no markdown fences, no extra text.
        6. Use this exact JSON structure:
           {
             "intent": "query|action|insight|unknown",
             "explanation": "A clear, concise, and helpful natural language explanation for the user",
             "action": {
               "name": "action_name",
               "params": { ... },
               "requires_confirmation": false
             },
             "data": { ... }
           }

        SUPPORTED ACTION NAMES & PARAMETERS:
        - create_task: { "project_id": <int>, "title": "<string>", "description": "<optional string>", "status": "todo|in_progress|in_review|done", "priority": "low|medium|high|urgent", "assigned_to": <optional employee_id>, "due_date": "<optional YYYY-MM-DD>" }
        - update_task_status: { "task_id": <int>, "status": "todo|in_progress|in_review|done" }
        - update_task: { "task_id": <int>, "title": "...", "description": "...", "status": "...", "priority": "...", "assigned_to": <int>, "due_date": "..." }
        - delete_task: { "task_id": <int> } [SENSITIVE - requires confirmation]
        - add_task_comment: { "task_id": <int>, "comment": "<string>" }
        - create_project: { "name": "<string>", "description": "...", "status": "planning|in_progress|on_hold|completed|cancelled", "start_date": "...", "end_date": "...", "manager_id": <employee_id>, "customer_id": <customer_id> }
        - update_project_status: { "project_id": <int>, "status": "planning|in_progress|on_hold|completed|cancelled" }
        - delete_project: { "project_id": <int> } [SENSITIVE - requires confirmation]
        - create_department: { "name": "<string>", "description": "..." }
        - delete_department: { "department_id": <int> } [SENSITIVE - requires confirmation]
        - create_employee: { "name": "<string>", "email": "<string>", "department_id": <int>, "job_title": "<string>", "role": "employee", "hire_date": "YYYY-MM-DD" }
        - delete_employee: { "employee_id": <int> } [SENSITIVE - requires confirmation]
        - delete_user: { "user_id": <int> } [SENSITIVE - requires confirmation]
        - create_customer: { "company_name": "<string>", "contact_name": "...", "email": "...", "phone": "..." }
        - delete_customer: { "customer_id": <int> } [SENSITIVE - requires confirmation]
        - log_attendance: { "employee_id": <optional int>, "status": "present|absent|late|half_day", "check_in_time": "HH:MM:SS" }

        SENSITIVE ACTIONS & PERMISSION CONFIRMATION RULES:
        - Destructive actions (delete_user, delete_employee, delete_task, delete_project, delete_department, delete_customer) MUST have "requires_confirmation": true.
        - For sensitive actions, formulate a clear confirmation prompt in "explanation" warning the user about permanent data deletion and asking for approval before proceeding.
        - For safe/non-destructive actions (create_task, update_task_status, update_task, add_task_comment, create_project, create_department, log_attendance), set "requires_confirmation": false.
        - Reference the user's role and database IDs accurately when constructing parameters.
        SYSTEM;

        $userContext = implode("\n", [
            "User ID: {$user->id}",
            "User Name: {$user->name}",
            "User Email: {$user->email}",
            "User Role: {$user->role?->value}",
        ]);

        $content = "Authenticated User Context:\n{$userContext}\n\n" .
                   "ERP Database Context:\n{$erpContext}\n\n" .
                   "User Question: {$userInput}";

        return [
            ['role' => 'system', 'content' => trim($systemPrompt)],
            ['role' => 'user', 'content' => $content],
        ];
    }

    /**
     * Build real ERP database context formatted cleanly for LLM consumption.
     */
    public function buildErpContext(User $user, string $userInput): string
    {
        $sections = [];

        try {
            $isCustomer = $user->role === Role::CUSTOMER;

            if ($isCustomer) {
                // Customer-specific ERP context
                $customer = Customer::where('user_id', $user->id)
                    ->orWhere('email', $user->email)
                    ->first();

                if ($customer) {
                    $sections[] = "=== YOUR CUSTOMER ACCOUNT ===";
                    $sections[] = "- ID: {$customer->id} | Company: {$customer->company_name} | Contact: {$customer->contact_name} | Email: {$customer->email} | Phone: {$customer->phone}";

                    $invoices = Invoice::where('customer_id', $customer->id)->get();
                    if ($invoices->isNotEmpty()) {
                        $sections[] = "\n=== YOUR INVOICES ===";
                        foreach ($invoices as $inv) {
                            $sections[] = "- Invoice #{$inv->invoice_number} (ID {$inv->id}): Total: \${$inv->total_amount} | Status: {$inv->status} | Issue Date: {$inv->issue_date} | Due: {$inv->due_date}";
                        }
                    }

                    $quotations = Quotation::where('customer_id', $customer->id)->get();
                    if ($quotations->isNotEmpty()) {
                        $sections[] = "\n=== YOUR QUOTATIONS ===";
                        foreach ($quotations as $quo) {
                            $sections[] = "- Quotation (ID {$quo->id}): Project: {$quo->project_name} | Total: \${$quo->total_amount} | Status: {$quo->status} | Valid Until: {$quo->valid_until}";
                        }
                    }

                    $projects = Project::where('customer_id', $customer->id)->get();
                    if ($projects->isNotEmpty()) {
                        $sections[] = "\n=== YOUR PROJECTS ===";
                        foreach ($projects as $proj) {
                            $status = $proj->status?->value ?? $proj->status;
                            $sections[] = "- Project #{$proj->id}: {$proj->name} | Status: {$status} | Description: {$proj->description}";
                        }
                    }
                }
            } else {
                // Internal staff ERP context (Admin, HR Manager, Project Manager, Employee, Accountant)

                // 1. Departments
                $departments = Department::withCount('employees')->get();
                if ($departments->isNotEmpty()) {
                    $sections[] = "=== DEPARTMENTS ===";
                    foreach ($departments as $dept) {
                        $sections[] = "- ID {$dept->id}: {$dept->name} | Description: {$dept->description} | Employees: {$dept->employees_count}";
                    }
                }

                // 2. Employees
                $employees = Employee::with(['user:id,name,email,role', 'department:id,name'])->get();
                if ($employees->isNotEmpty()) {
                    $sections[] = "\n=== EMPLOYEES (Total: {$employees->count()}) ===";
                    foreach ($employees as $emp) {
                        $name = $emp->user?->name ?? 'N/A';
                        $email = $emp->user?->email ?? 'N/A';
                        $dept = $emp->department?->name ?? 'Unassigned';
                        $status = $emp->employment_status?->value ?? $emp->employment_status ?? 'active';
                        $hireDate = $emp->hire_date ? $emp->hire_date->toDateString() : 'N/A';
                        $sections[] = "- Employee ID {$emp->id} (User ID {$emp->user_id}): Name: {$name} | Email: {$email} | Department: {$dept} | Job Title: {$emp->job_title} | Status: {$status} | Hire Date: {$hireDate}";
                    }
                }

                // 3. Projects
                $projects = Project::with(['manager.user:id,name', 'members.user:id,name'])->get();
                if ($projects->isNotEmpty()) {
                    $sections[] = "\n=== PROJECTS (Total: {$projects->count()}) ===";
                    foreach ($projects as $proj) {
                        $status = $proj->status?->value ?? $proj->status;
                        $manager = $proj->manager?->user?->name ?? 'None';
                        $members = $proj->members->map(fn($m) => $m->user?->name)->filter()->implode(', ');
                        $startDate = $proj->start_date ? $proj->start_date->toDateString() : 'N/A';
                        $endDate = $proj->end_date ? $proj->end_date->toDateString() : 'N/A';
                        $sections[] = "- Project ID {$proj->id}: {$proj->name} | Status: {$status} | Manager: {$manager} | Dates: {$startDate} to {$endDate} | Members: [{$members}] | Description: {$proj->description}";
                    }
                }

                // 4. Tasks
                $tasks = Task::with(['project:id,name', 'assignee.user:id,name'])->get();
                if ($tasks->isNotEmpty()) {
                    $sections[] = "\n=== TASKS (Total: {$tasks->count()}) ===";
                    foreach ($tasks as $task) {
                        $status = $task->status?->value ?? $task->status;
                        $priority = $task->priority?->value ?? $task->priority;
                        $project = $task->project?->name ?? 'No Project';
                        $assignee = $task->assignee?->user?->name ?? 'Unassigned';
                        $dueDate = $task->due_date ? $task->due_date->toDateString() : 'N/A';
                        $sections[] = "- Task ID {$task->id}: \"{$task->title}\" | Project: {$project} | Assigned: {$assignee} | Status: {$status} | Priority: {$priority} | Due: {$dueDate}";
                    }
                }

                // 5. Attendance (Recent)
                $attendances = Attendance::with('employee.user:id,name')
                    ->orderBy('date', 'desc')
                    ->limit(30)
                    ->get();
                if ($attendances->isNotEmpty()) {
                    $sections[] = "\n=== RECENT ATTENDANCE RECORDS ===";
                    foreach ($attendances as $att) {
                        $empName = $att->employee?->user?->name ?? "Employee #{$att->employee_id}";
                        $date = $att->date ? $att->date->toDateString() : 'N/A';
                        $status = $att->status?->value ?? $att->status;
                        $sections[] = "- Date: {$date} | Employee: {$empName} | Status: {$status} | Check-in: {$att->check_in_time} | Check-out: {$att->check_out_time}";
                    }
                }

                // 6. Customers, Invoices, Quotations, Payments
                $customers = Customer::all();
                if ($customers->isNotEmpty()) {
                    $sections[] = "\n=== CUSTOMERS (Total: {$customers->count()}) ===";
                    foreach ($customers as $c) {
                        $sections[] = "- Customer ID {$c->id}: {$c->company_name} (Contact: {$c->contact_name}, Email: {$c->email}, City: {$c->city}, Country: {$c->country})";
                    }
                }

                $invoices = Invoice::with('customer:id,company_name')->get();
                if ($invoices->isNotEmpty()) {
                    $sections[] = "\n=== INVOICES (Total: {$invoices->count()}) ===";
                    foreach ($invoices as $inv) {
                        $custName = $inv->customer?->company_name ?? 'N/A';
                        $sections[] = "- Invoice #{$inv->invoice_number} (ID {$inv->id}): Customer: {$custName} | Total: \${$inv->total_amount} | Status: {$inv->status} | Due: {$inv->due_date}";
                    }
                }

                $quotations = Quotation::with('customer:id,company_name')->get();
                if ($quotations->isNotEmpty()) {
                    $sections[] = "\n=== QUOTATIONS (Total: {$quotations->count()}) ===";
                    foreach ($quotations as $quo) {
                        $custName = $quo->customer?->company_name ?? 'N/A';
                        $sections[] = "- Quotation #{$quo->quotation_number} (ID {$quo->id}): Customer: {$custName} | Project: {$quo->project_name} | Total: \${$quo->total_amount} | Status: {$quo->status}";
                    }
                }

                $payments = Payment::with('invoice:id,invoice_number')->get();
                if ($payments->isNotEmpty()) {
                    $sections[] = "\n=== PAYMENTS (Total: {$payments->count()}) ===";
                    foreach ($payments as $pay) {
                        $invNum = $pay->invoice?->invoice_number ?? "ID #{$pay->invoice_id}";
                        $paidAt = $pay->paid_at ? $pay->paid_at->toDateTimeString() : 'N/A';
                        $sections[] = "- Payment ID {$pay->id}: Invoice: {$invNum} | Amount: {$pay->amount} {$pay->currency} | Channel: {$pay->channel} | Status: {$pay->status} | Paid At: {$paidAt}";
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error building ERP database context for AI Assistant', [
                'error' => $e->getMessage(),
            ]);
        }

        return empty($sections) ? 'No database records found.' : implode("\n", $sections);
    }

    /**
     * Call the configured AI provider via AiProviderInterface.
     *
     * @param  array  $messages  Structured messages array from buildMessages()
     * @param  array  $options   Optional provider parameters (model, temperature, etc.)
     * @return array  ['success' => bool, 'content' => string|null, 'reasoning' => string|null, 'raw' => array|null, 'error' => string|null, 'provider' => string|null]
     */
    public function callLLM(array $messages, array $options = []): array
    {
        return $this->aiProvider->chat($messages, $options);
    }

    /**
     * Parse the LLM's JSON response into a structured array.
     */
    public function parseResponse(string $text): array
    {
        try {
            // Remove reasoning / think blocks if present
            $cleaned = preg_replace('/<think>[\s\S]*?<\/think>/i', '', $text);

            // Strip markdown code fences if the LLM wraps JSON in ```json ... ```
            $cleaned = preg_replace('/^```(?:json)?\s*/i', '', $cleaned);
            $cleaned = preg_replace('/\s*```$/i', '', $cleaned);
            $cleaned = trim($cleaned);

            // Try to extract the JSON object
            if (preg_match('/\{[\s\S]*\}/', $cleaned, $matches)) {
                $data = json_decode($matches[0], true, 512, JSON_THROW_ON_ERROR);
            } else {
                $data = json_decode($cleaned, true, 512, JSON_THROW_ON_ERROR);
            }

            if (!is_array($data)) {
                return ['success' => false, 'error' => 'LLM response is not a valid JSON object'];
            }

            return [
                'success' => true,
                'intent' => $data['intent'] ?? 'unknown',
                'explanation' => $data['explanation'] ?? '',
                'action' => $data['action'] ?? null,
                'data' => $data['data'] ?? null,
                'raw' => $data,
            ];
        } catch (\JsonException $e) {
            Log::warning('LLM JSON parse failed', [
                'error' => $e->getMessage(),
                'raw_text' => mb_substr($text, 0, 500),
            ]);
            return ['success' => false, 'error' => 'Failed to parse LLM response as JSON'];
        }
    }
}