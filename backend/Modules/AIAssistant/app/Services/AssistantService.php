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

    /**
     * Sections the smart context builder can load.
     * Each key maps to a method and a set of trigger keywords.
     */
    private const SECTION_KEYWORDS = [
        'departments'  => ['department', 'dept', 'team', 'division', 'unit', 'organization', 'org'],
        'employees'    => ['employee', 'staff', 'worker', 'personnel', 'hire', 'name', 'who', 'people', 'member', 'colleague'],
        'projects'     => ['project', 'initiative', 'program', 'deadline', 'milestone', 'scope', 'plan', 'template', 'generate tasks'],
        'tasks'        => ['task', 'todo', 'ticket', 'assignment', 'kanban', 'sprint', 'backlog', 'subtask', 'template', 'generate tasks', 'create tasks'],
        'attendance'   => ['attendance', 'check-in', 'check-out', 'checkin', 'checkout', 'absent', 'late', 'present', 'half_day', 'leave', 'clock'],
        'customers'    => ['customer', 'client', 'account', 'company', 'contact', 'buyer'],
        'invoices'     => ['invoice', 'bill', 'billing', 'receivable', 'outstanding', 'overdue', 'due', 'payment due'],
        'quotations'   => ['quotation', 'quote', 'proposal', 'estimate', 'offer', 'bid'],
        'payments'     => ['payment', 'pay', 'paid', 'transaction', 'revenue', 'collection', 'money', 'momo', 'orange'],
    ];

    /**
     * Maximum records per section to prevent token overflow.
     */
    private const SECTION_LIMITS = [
        'departments'  => 30,
        'employees'    => 25,
        'projects'     => 20,
        'tasks'        => 30,
        'attendance'   => 20,
        'customers'    => 25,
        'invoices'     => 20,
        'quotations'   => 15,
        'payments'     => 15,
    ];

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
        $relevantSections = $this->detectRelevantSections($userInput);
        $erpContext = $this->buildErpContext($user, $userInput, $relevantSections);

        $systemPrompt = <<<SYSTEM
        You are Modoo AI — the intelligent ERP assistant embedded in Modoo ERP.
        You help employees understand real ERP data, answer questions, and perform authorized business actions.

        Current Date & Time: {$currentDate}

        ════════════════════════════════════════════
        CRITICAL ANTI-HALLUCINATION RULES
        ════════════════════════════════════════════
        1. You may ONLY reference data that appears in the "ERP DATABASE CONTEXT" section below.
        2. If an employee, project, task, customer, invoice, or any record is NOT listed in the context, it DOES NOT EXIST. Do not invent it.
        3. If the user asks about something not in the context, respond: "I could not find any matching records in the current database."
        4. NEVER fabricate names, IDs, numbers, dates, or counts. Every fact you state must trace back to a specific line in the context.
        5. When listing records, reproduce them EXACTLY as shown — do not add extras or omit any.
        6. If a section says "Showing X of Y total", acknowledge the total but only reference the X records shown.
        7. When referencing an ID for an action, it MUST be an ID that appears verbatim in the context.

        ════════════════════════════════════════════
        RESPONSE FORMAT
        ════════════════════════════════════════════
        Always respond with ONLY valid JSON — no markdown fences, no extra text outside the JSON object.
        Use this exact structure:
           {
             "intent": "query|action|insight|unknown",
             "explanation": "Rich markdown-formatted natural language response (see rules below)",
             "action": {
               "name": "action_name",
               "params": { ... },
               "requires_confirmation": false
             },
             "data": { ... }
           }

        For "query" and "insight" intents, omit the "action" field (set to null).
        For "action" intents, always include the "action" object with valid parameters.

        ════════════════════════════════════════════
        EXPLANATION FORMATTING RULES (VERY IMPORTANT)
        ════════════════════════════════════════════
        The "explanation" field is what the user reads directly. It must be in NATURAL LANGUAGE with rich markdown formatting:

        1. **Write conversationally** — as if speaking to a colleague. Not robotic or terse.
        2. **Use markdown tables** when presenting lists or comparisons of records. Example:
           | Employee | Department | Status |
           |----------|-----------|--------|
           | John Doe | Engineering | Active |
        3. **Use bold** for important values like names, amounts, statuses, and dates.
        4. **Use bullet lists** for summaries, key takeaways, or action steps.
        5. **Use headings** (##, ###) to organize long responses into readable sections.
        6. **Include context** — don't just list data, explain what it means:
           - BAD: "Here are the employees."
           - GOOD: "Your team currently has **12 active employees** across 3 departments. Here's the breakdown:"
        7. **Add insights** when relevant — trends, warnings, notable items:
           - "⚠️ Invoice #INV-2024-003 is **overdue by 15 days** — you may want to follow up."
           - "📊 **3 out of 5 tasks** in Project Alpha are still in 'todo' status."
        8. For completed actions, explain exactly what happened and suggest next steps.
        9. For confirmation prompts, clearly state the impact in natural language.
        10. **Never dump raw data** — always present it in a human-friendly way with tables or formatted lists.
        11. Keep responses focused and practical — a business user should understand everything immediately.

        ════════════════════════════════════════════
        SUPPORTED ACTIONS & PARAMETERS
        ════════════════════════════════════════════
        - create_task: { "project_id": <int>, "title": "<string>", "description": "<optional>", "status": "todo|in_progress|in_review|done", "priority": "low|medium|high|urgent", "assigned_to": <optional employee_id>, "due_date": "<optional YYYY-MM-DD>" }
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
        - generate_task_templates: { "project_id": <optional int>, "project_description": "<string describing the project or work>", "count": <optional int, default 5, max 15> }
        - bulk_create_tasks: { "project_id": <int>, "tasks": [{ "title": "<string>", "description": "<optional>", "priority": "low|medium|high|urgent", "status": "todo", "due_date": "<optional YYYY-MM-DD>", "assigned_to": <optional employee_id> }, ...] }

        SENSITIVE ACTIONS & CONFIRMATION RULES:
        - Destructive actions (delete_*) MUST have "requires_confirmation": true.
        - Non-destructive actions set "requires_confirmation": false.
        - Reference the user's role and database IDs accurately when constructing parameters.

        ════════════════════════════════════════════
        TASK TEMPLATE GENERATION RULES
        ════════════════════════════════════════════
        When the user asks to "generate tasks", "suggest tasks", "create task templates", or similar:
        - Use "intent": "action" with action name "generate_task_templates".
        - In "params.project_description", include the user's description of the project/work.
        - If the user specifies a project, include "params.project_id".
        - In the "data" field, provide the generated task templates as an array:
          "data": { "templates": [{ "title": "...", "description": "...", "priority": "...", "status": "todo" }, ...] }
        - Each template should have a clear, actionable title and a short description.
        - Generate practical, real-world tasks — not generic placeholders.
        - Vary priorities realistically (not all "high").

        When the user confirms/approves generated templates, use "bulk_create_tasks" to create them all.
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
     * Detect which database sections are relevant to the user's query.
     *
     * Uses keyword matching to avoid loading irrelevant data into the LLM context.
     * Falls back to loading all sections for broad/ambiguous queries.
     *
     * @return array<string> List of section keys to load
     */
    public function detectRelevantSections(string $userInput): array
    {
        $input = mb_strtolower($userInput);
        $matched = [];

        foreach (self::SECTION_KEYWORDS as $section => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($input, $keyword)) {
                    $matched[] = $section;
                    break; // one keyword match per section is enough
                }
            }
        }

        // Broad / ambiguous queries → give everything to avoid missing context
        $broadTriggers = ['everything', 'all', 'summary', 'overview', 'dashboard', 'report', 'status', 'how is', 'what is going on', 'tell me about'];
        foreach ($broadTriggers as $trigger) {
            if (str_contains($input, $trigger)) {
                return array_keys(self::SECTION_KEYWORDS);
            }
        }

        // If no sections matched, load core sections as fallback
        if (empty($matched)) {
            return ['departments', 'employees', 'projects', 'tasks'];
        }

        // Always add employees for name resolution when actions reference people
        if (!in_array('employees', $matched) && (str_contains($input, 'assign') || str_contains($input, 'create') || str_contains($input, 'who'))) {
            $matched[] = 'employees';
        }

        // Always add projects when tasks are loaded (needed for project_id resolution)
        if (in_array('tasks', $matched) && !in_array('projects', $matched)) {
            $matched[] = 'projects';
        }

        return array_unique($matched);
    }

    /**
     * Build real ERP database context formatted cleanly for LLM consumption.
     *
     * Only loads sections identified as relevant to the query. Each section
     * includes explicit record counts so the LLM knows exact data boundaries.
     *
     * @param array<string> $relevantSections Section keys to load
     */
    public function buildErpContext(User $user, string $userInput, array $relevantSections = []): string
    {
        $sections = [];

        // Default to all sections if none specified (backwards compatibility)
        if (empty($relevantSections)) {
            $relevantSections = array_keys(self::SECTION_KEYWORDS);
        }

        try {
            $isCustomer = $user->role === Role::CUSTOMER;

            if ($isCustomer) {
                $sections = $this->buildCustomerContext($user);
            } else {
                $sections = $this->buildStaffContext($user, $relevantSections);
            }
        } catch (\Throwable $e) {
            Log::warning('Error building ERP database context for AI Assistant', [
                'error' => $e->getMessage(),
            ]);
        }

        if (empty($sections)) {
            return "No database records found for the requested sections.\nLoaded sections: " . implode(', ', $relevantSections);
        }

        // Add a data boundary footer so the LLM knows where context ends
        $sections[] = "\n════════════════════════════════════════════";
        $sections[] = "END OF DATABASE CONTEXT — Do NOT reference any data beyond this point.";
        $sections[] = "════════════════════════════════════════════";

        return implode("\n", $sections);
    }

    /**
     * Build context for customer-role users (limited to their own data).
     */
    private function buildCustomerContext(User $user): array
    {
        $sections = [];

        $customer = Customer::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        if (!$customer) {
            return ["No customer profile found for your account."];
        }

        $sections[] = "=== YOUR CUSTOMER ACCOUNT ===";
        $sections[] = "- ID: {$customer->id} | Company: {$customer->company_name} | Contact: {$customer->contact_name} | Email: {$customer->email} | Phone: {$customer->phone}";

        $invoices = Invoice::where('customer_id', $customer->id)->get();
        if ($invoices->isNotEmpty()) {
            $sections[] = "\n=== YOUR INVOICES (EXACTLY {$invoices->count()} records) ===";
            foreach ($invoices as $inv) {
                $sections[] = "- Invoice #{$inv->invoice_number} (ID {$inv->id}): Total: \${$inv->total_amount} | Status: {$inv->status} | Issue Date: {$inv->issue_date} | Due: {$inv->due_date}";
            }
        }

        $quotations = Quotation::where('customer_id', $customer->id)->get();
        if ($quotations->isNotEmpty()) {
            $sections[] = "\n=== YOUR QUOTATIONS (EXACTLY {$quotations->count()} records) ===";
            foreach ($quotations as $quo) {
                $sections[] = "- Quotation (ID {$quo->id}): Project: {$quo->project_name} | Total: \${$quo->total_amount} | Status: {$quo->status} | Valid Until: {$quo->valid_until}";
            }
        }

        $projects = Project::where('customer_id', $customer->id)->get();
        if ($projects->isNotEmpty()) {
            $sections[] = "\n=== YOUR PROJECTS (EXACTLY {$projects->count()} records) ===";
            foreach ($projects as $proj) {
                $status = $proj->status?->value ?? $proj->status;
                $sections[] = "- Project #{$proj->id}: {$proj->name} | Status: {$status} | Description: {$proj->description}";
            }
        }

        return $sections;
    }

    /**
     * Build context for internal staff users, loading only relevant sections.
     *
     * @param array<string> $relevantSections
     */
    private function buildStaffContext(User $user, array $relevantSections): array
    {
        $sections = [];
        $loadedInfo = [];

        // 1. Departments
        if (in_array('departments', $relevantSections)) {
            $limit = self::SECTION_LIMITS['departments'];
            $total = Department::count();
            $departments = Department::withCount('employees')->limit($limit)->get();
            if ($departments->isNotEmpty()) {
                $shown = $departments->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "=== DEPARTMENTS ({$label}) ===";
                foreach ($departments as $dept) {
                    $sections[] = "- ID {$dept->id}: {$dept->name} | Description: {$dept->description} | Employees: {$dept->employees_count}";
                }
                $loadedInfo[] = "departments({$shown})";
            }
        }

        // 2. Employees
        if (in_array('employees', $relevantSections)) {
            $limit = self::SECTION_LIMITS['employees'];
            $total = Employee::count();
            $employees = Employee::with(['user:id,name,email,role', 'department:id,name'])->limit($limit)->get();
            if ($employees->isNotEmpty()) {
                $shown = $employees->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== EMPLOYEES ({$label}) ===";
                foreach ($employees as $emp) {
                    $name = $emp->user?->name ?? 'N/A';
                    $email = $emp->user?->email ?? 'N/A';
                    $dept = $emp->department?->name ?? 'Unassigned';
                    $status = $emp->employment_status?->value ?? $emp->employment_status ?? 'active';
                    $hireDate = $emp->hire_date ? $emp->hire_date->toDateString() : 'N/A';
                    $sections[] = "- Employee ID {$emp->id} (User ID {$emp->user_id}): Name: {$name} | Email: {$email} | Department: {$dept} | Job Title: {$emp->job_title} | Status: {$status} | Hire Date: {$hireDate}";
                }
                $loadedInfo[] = "employees({$shown})";
            }
        }

        // 3. Projects
        if (in_array('projects', $relevantSections)) {
            $limit = self::SECTION_LIMITS['projects'];
            $total = Project::count();
            $projects = Project::with(['manager.user:id,name', 'members.user:id,name'])->limit($limit)->get();
            if ($projects->isNotEmpty()) {
                $shown = $projects->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== PROJECTS ({$label}) ===";
                foreach ($projects as $proj) {
                    $status = $proj->status?->value ?? $proj->status;
                    $manager = $proj->manager?->user?->name ?? 'None';
                    $members = $proj->members->map(fn($m) => $m->user?->name)->filter()->implode(', ');
                    $startDate = $proj->start_date ? $proj->start_date->toDateString() : 'N/A';
                    $endDate = $proj->end_date ? $proj->end_date->toDateString() : 'N/A';
                    $sections[] = "- Project ID {$proj->id}: {$proj->name} | Status: {$status} | Manager: {$manager} | Dates: {$startDate} to {$endDate} | Members: [{$members}] | Description: {$proj->description}";
                }
                $loadedInfo[] = "projects({$shown})";
            }
        }

        // 4. Tasks
        if (in_array('tasks', $relevantSections)) {
            $limit = self::SECTION_LIMITS['tasks'];
            $total = Task::count();
            $tasks = Task::with(['project:id,name', 'assignee.user:id,name'])->limit($limit)->get();
            if ($tasks->isNotEmpty()) {
                $shown = $tasks->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== TASKS ({$label}) ===";
                foreach ($tasks as $task) {
                    $status = $task->status?->value ?? $task->status;
                    $priority = $task->priority?->value ?? $task->priority;
                    $project = $task->project?->name ?? 'No Project';
                    $assignee = $task->assignee?->user?->name ?? 'Unassigned';
                    $dueDate = $task->due_date ? $task->due_date->toDateString() : 'N/A';
                    $sections[] = "- Task ID {$task->id}: \"{$task->title}\" | Project: {$project} | Assigned: {$assignee} | Status: {$status} | Priority: {$priority} | Due: {$dueDate}";
                }
                $loadedInfo[] = "tasks({$shown})";
            }
        }

        // 5. Attendance (Recent)
        if (in_array('attendance', $relevantSections)) {
            $limit = self::SECTION_LIMITS['attendance'];
            $attendances = Attendance::with('employee.user:id,name')
                ->orderBy('date', 'desc')
                ->limit($limit)
                ->get();
            if ($attendances->isNotEmpty()) {
                $sections[] = "\n=== RECENT ATTENDANCE RECORDS ({$attendances->count()} most recent) ===";
                foreach ($attendances as $att) {
                    $empName = $att->employee?->user?->name ?? "Employee #{$att->employee_id}";
                    $date = $att->date ? $att->date->toDateString() : 'N/A';
                    $status = $att->status?->value ?? $att->status;
                    $sections[] = "- Date: {$date} | Employee: {$empName} | Status: {$status} | Check-in: {$att->check_in_time} | Check-out: {$att->check_out_time}";
                }
                $loadedInfo[] = "attendance({$attendances->count()})";
            }
        }

        // 6. Customers
        if (in_array('customers', $relevantSections)) {
            $limit = self::SECTION_LIMITS['customers'];
            $total = Customer::count();
            $customers = Customer::limit($limit)->get();
            if ($customers->isNotEmpty()) {
                $shown = $customers->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== CUSTOMERS ({$label}) ===";
                foreach ($customers as $c) {
                    $sections[] = "- Customer ID {$c->id}: {$c->company_name} (Contact: {$c->contact_name}, Email: {$c->email}, City: {$c->city}, Country: {$c->country})";
                }
                $loadedInfo[] = "customers({$shown})";
            }
        }

        // 7. Invoices
        if (in_array('invoices', $relevantSections)) {
            $limit = self::SECTION_LIMITS['invoices'];
            $total = Invoice::count();
            $invoices = Invoice::with('customer:id,company_name')->limit($limit)->get();
            if ($invoices->isNotEmpty()) {
                $shown = $invoices->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== INVOICES ({$label}) ===";
                foreach ($invoices as $inv) {
                    $custName = $inv->customer?->company_name ?? 'N/A';
                    $sections[] = "- Invoice #{$inv->invoice_number} (ID {$inv->id}): Customer: {$custName} | Total: \${$inv->total_amount} | Status: {$inv->status} | Due: {$inv->due_date}";
                }
                $loadedInfo[] = "invoices({$shown})";
            }
        }

        // 8. Quotations
        if (in_array('quotations', $relevantSections)) {
            $limit = self::SECTION_LIMITS['quotations'];
            $total = Quotation::count();
            $quotations = Quotation::with('customer:id,company_name')->limit($limit)->get();
            if ($quotations->isNotEmpty()) {
                $shown = $quotations->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== QUOTATIONS ({$label}) ===";
                foreach ($quotations as $quo) {
                    $custName = $quo->customer?->company_name ?? 'N/A';
                    $sections[] = "- Quotation #{$quo->quotation_number} (ID {$quo->id}): Customer: {$custName} | Project: {$quo->project_name} | Total: \${$quo->total_amount} | Status: {$quo->status}";
                }
                $loadedInfo[] = "quotations({$shown})";
            }
        }

        // 9. Payments
        if (in_array('payments', $relevantSections)) {
            $limit = self::SECTION_LIMITS['payments'];
            $total = Payment::count();
            $payments = Payment::with('invoice:id,invoice_number')->limit($limit)->get();
            if ($payments->isNotEmpty()) {
                $shown = $payments->count();
                $label = $shown < $total ? "Showing {$shown} of {$total} total" : "EXACTLY {$total} records";
                $sections[] = "\n=== PAYMENTS ({$label}) ===";
                foreach ($payments as $pay) {
                    $invNum = $pay->invoice?->invoice_number ?? "ID #{$pay->invoice_id}";
                    $paidAt = $pay->paid_at ? $pay->paid_at->toDateTimeString() : 'N/A';
                    $sections[] = "- Payment ID {$pay->id}: Invoice: {$invNum} | Amount: {$pay->amount} {$pay->currency} | Channel: {$pay->channel} | Status: {$pay->status} | Paid At: {$paidAt}";
                }
                $loadedInfo[] = "payments({$shown})";
            }
        }

        // Prepend a data summary header so the LLM knows what was loaded
        if (!empty($loadedInfo)) {
            array_unshift($sections, "DATA LOADED: " . implode(', ', $loadedInfo) . "\n");
        }

        return $sections;
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

    /**
     * Validate the parsed LLM response against real database records.
     *
     * Catches hallucinated entity IDs before they reach the action executor.
     * Returns the parsed data unchanged if valid, or an error array if invalid.
     */
    public function validateResponse(array $parsed): array
    {
        // Only validate action intents with parameters
        if (($parsed['intent'] ?? '') !== 'action' || empty($parsed['action']['name'])) {
            return $parsed;
        }

        $action = $parsed['action'];
        $actionName = $action['name'];
        $params = $action['params'] ?? [];
        $errors = [];

        // Validate referenced entity IDs exist
        if (!empty($params['project_id'])) {
            if (!Project::where('id', $params['project_id'])->exists()) {
                $errors[] = "Project ID {$params['project_id']} does not exist";
            }
        }

        if (!empty($params['task_id'])) {
            if (!Task::where('id', $params['task_id'])->exists()) {
                $errors[] = "Task ID {$params['task_id']} does not exist";
            }
        }

        if (!empty($params['employee_id'])) {
            if (!Employee::where('id', $params['employee_id'])->exists()) {
                $errors[] = "Employee ID {$params['employee_id']} does not exist";
            }
        }

        if (!empty($params['assigned_to'])) {
            if (!Employee::where('id', $params['assigned_to'])->exists()) {
                $errors[] = "Assigned employee ID {$params['assigned_to']} does not exist";
            }
        }

        if (!empty($params['department_id'])) {
            if (!Department::where('id', $params['department_id'])->exists()) {
                $errors[] = "Department ID {$params['department_id']} does not exist";
            }
        }

        if (!empty($params['customer_id'])) {
            if (!Customer::where('id', $params['customer_id'])->exists()) {
                $errors[] = "Customer ID {$params['customer_id']} does not exist";
            }
        }

        if (!empty($params['user_id'])) {
            if (!User::where('id', $params['user_id'])->exists()) {
                $errors[] = "User ID {$params['user_id']} does not exist";
            }
        }

        if (!empty($params['manager_id'])) {
            if (!Employee::where('id', $params['manager_id'])->exists()) {
                $errors[] = "Manager (employee) ID {$params['manager_id']} does not exist";
            }
        }

        // Validate bulk task references in bulk_create_tasks
        if ($actionName === 'bulk_create_tasks' && !empty($params['tasks']) && is_array($params['tasks'])) {
            foreach ($params['tasks'] as $i => $taskDef) {
                if (!empty($taskDef['assigned_to']) && !Employee::where('id', $taskDef['assigned_to'])->exists()) {
                    $errors[] = "Task #{$i}: Assigned employee ID {$taskDef['assigned_to']} does not exist";
                }
            }
        }

        if (!empty($errors)) {
            $errorSummary = implode('; ', $errors);
            Log::warning('LLM response validation failed — hallucinated entity IDs', [
                'action' => $actionName,
                'params' => $params,
                'errors' => $errors,
            ]);

            return [
                'success' => false,
                'error' => "The AI referenced records that don't exist in the database: {$errorSummary}. Please try rephrasing your request with correct details.",
                'validation_errors' => $errors,
            ];
        }

        return $parsed;
    }
}
