<?php

namespace Modules\AIAssistant\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\AIAssistant\Services\AssistantService;
use Modules\AIAssistant\Services\AssistantActionExecutor;
use Modules\AIAssistant\Models\AgentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AIAssistantController extends Controller
{
    public function __construct(
        private AssistantService $assistantService,
        private AssistantActionExecutor $actionExecutor
    ) {
    }

    /**
     * Ask the AI assistant a question or request an action.
     *
     * POST /api/assistant/ask
     * Body: { "question": "..." }
     */
    public function ask(Request $request): JsonResponse
    {
        // Prevent PHP from timing out while waiting for the LLM API
        set_time_limit(120);

        $validated = $request->validate([
            'question' => 'required|string|max:2000',
        ]);

        $user = $request->user();
        $userInput = $validated['question'];

        // Check if there is an active pending confirmation from this user in the last 15 minutes
        $lastPending = AgentRequest::where('user_id', $user->id)
            ->where('status', 'pending_confirmation')
            ->where('created_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if ($lastPending) {
            $trimmed = trim(strtolower($userInput));
            if (preg_match('/^(yes|confirm|proceed|sure|do it|go ahead|approve|ok|okay|yep|yeah|execute)\b/i', $trimmed)) {
                $parsedAction = $lastPending->parsed_action;
                $actionName = $parsedAction['name'] ?? '';
                $params = $parsedAction['params'] ?? [];

                $result = $this->actionExecutor->execute($actionName, $params, $user);

                if ($result['success']) {
                    $lastPending->update([
                        'status' => 'done',
                        'result' => json_encode($result['data']),
                    ]);

                    return response()->json([
                        'agent_request_id' => $lastPending->id,
                        'status' => 'executed',
                        'intent' => 'action',
                        'action' => $actionName,
                        'explanation' => $result['message'],
                        'data' => $result['data'],
                    ], 200);
                }

                $lastPending->update([
                    'status' => 'failed',
                    'error_log' => $result['error'],
                ]);

                return response()->json([
                    'agent_request_id' => $lastPending->id,
                    'status' => 'failed',
                    'intent' => 'action',
                    'action' => $actionName,
                    'error' => $result['error'],
                    'explanation' => "Action execution failed: {$result['error']}",
                ], 422);
            }

            if (preg_match('/^(no|cancel|stop|abort|don\'t|dont|reject|no thanks|nevermind)\b/i', $trimmed)) {
                $lastPending->update([
                    'status' => 'cancelled',
                    'result' => json_encode(['cancelled' => true]),
                ]);

                return response()->json([
                    'agent_request_id' => $lastPending->id,
                    'status' => 'cancelled',
                    'intent' => 'action',
                    'action' => $lastPending->parsed_action['name'] ?? null,
                    'explanation' => 'Action was cancelled successfully. No modifications were made.',
                    'data' => null,
                ], 200);
            }
        }

        // Build structured messages (system + user + database context)
        $messages = $this->assistantService->buildMessages($user, $userInput);

        // Call the NVIDIA NIM API
        $llmResult = $this->assistantService->callLLM($messages);

        if (!$llmResult['success']) {
            return response()->json([
                'error' => $llmResult['error'],
            ], 502);
        }

        // Parse the LLM's JSON response
        $parsed = $this->assistantService->parseResponse($llmResult['content']);

        if (!$parsed['success']) {
            // Store the failed request for debugging
            AgentRequest::create([
                'user_id' => $user->id,
                'user_input' => $userInput,
                'prompt' => json_encode($messages),
                'llm_response' => $llmResult['raw'],
                'status' => 'parse_error',
                'error_log' => $parsed['error'],
            ]);

            return response()->json([
                'error' => 'AI response could not be parsed',
                'raw_response' => $llmResult['content'],
            ], 422);
        }

        // If Intent is an Action
        if (($parsed['intent'] ?? '') === 'action' && !empty($parsed['action']['name'])) {
            $action = $parsed['action'];
            $actionName = $action['name'];
            $params = $action['params'] ?? [];

            // Permission Check
            if (!$this->actionExecutor->canUserExecute($user, $actionName)) {
                $agentRequest = AgentRequest::create([
                    'user_id' => $user->id,
                    'user_input' => $userInput,
                    'prompt' => json_encode($messages),
                    'intent' => 'action',
                    'llm_response' => $llmResult['raw'],
                    'parsed_action' => $action,
                    'status' => 'forbidden',
                    'error_log' => "User role '{$user->role?->value}' is not authorized to execute '{$actionName}'",
                ]);

                return response()->json([
                    'agent_request_id' => $agentRequest->id,
                    'status' => 'forbidden',
                    'intent' => 'action',
                    'action' => $actionName,
                    'explanation' => "You do not have permission to execute '{$actionName}'. Your current role is '{$user->role?->value}'.",
                    'data' => null,
                ], 403);
            }

            // Sensitivity / Confirmation Check
            $isSensitive = $this->actionExecutor->isSensitive($actionName) || !empty($action['requires_confirmation']);

            if ($isSensitive) {
                $prep = $this->actionExecutor->prepareSensitiveAction($user, $actionName, $params);

                if (!$prep['allowed']) {
                    $agentRequest = AgentRequest::create([
                        'user_id' => $user->id,
                        'user_input' => $userInput,
                        'prompt' => json_encode($messages),
                        'intent' => 'action',
                        'llm_response' => $llmResult['raw'],
                        'parsed_action' => $action,
                        'status' => 'failed',
                        'error_log' => $prep['error'],
                    ]);

                    return response()->json([
                        'agent_request_id' => $agentRequest->id,
                        'status' => 'failed',
                        'intent' => 'action',
                        'action' => $actionName,
                        'error' => $prep['error'],
                        'explanation' => $prep['error'],
                    ], 422);
                }

                $agentRequest = AgentRequest::create([
                    'user_id' => $user->id,
                    'user_input' => $userInput,
                    'prompt' => json_encode($messages),
                    'intent' => 'action',
                    'llm_response' => $llmResult['raw'],
                    'parsed_action' => [
                        'name' => $actionName,
                        'params' => $params,
                        'requires_confirmation' => true,
                        'target_summary' => $prep['target_summary'] ?? null,
                    ],
                    'status' => 'pending_confirmation',
                ]);

                return response()->json([
                    'agent_request_id' => $agentRequest->id,
                    'intent' => 'action',
                    'action' => $actionName,
                    'status' => 'pending_confirmation',
                    'requires_confirmation' => true,
                    'confirmation_message' => $prep['confirmation_message'],
                    'explanation' => $prep['confirmation_message'],
                    'pending_action' => [
                        'name' => $actionName,
                        'params' => $params,
                        'target_summary' => $prep['target_summary'] ?? null,
                    ],
                    'data' => null,
                    'reasoning' => $llmResult['reasoning'] ?? null,
                ], 200);
            }

            // Non-sensitive action: execute immediately
            $result = $this->actionExecutor->execute($actionName, $params, $user);

            if ($result['success']) {
                $agentRequest = AgentRequest::create([
                    'user_id' => $user->id,
                    'user_input' => $userInput,
                    'prompt' => json_encode($messages),
                    'intent' => 'action',
                    'llm_response' => $llmResult['raw'],
                    'parsed_action' => $action,
                    'status' => 'done',
                    'result' => json_encode($result['data']),
                ]);

                return response()->json([
                    'agent_request_id' => $agentRequest->id,
                    'status' => 'executed',
                    'intent' => 'action',
                    'action' => $actionName,
                    'requires_confirmation' => false,
                    'explanation' => $result['message'],
                    'data' => $result['data'],
                    'reasoning' => $llmResult['reasoning'] ?? null,
                ], 200);
            }

            $agentRequest = AgentRequest::create([
                'user_id' => $user->id,
                'user_input' => $userInput,
                'prompt' => json_encode($messages),
                'intent' => 'action',
                'llm_response' => $llmResult['raw'],
                'parsed_action' => $action,
                'status' => 'failed',
                'error_log' => $result['error'],
            ]);

            return response()->json([
                'agent_request_id' => $agentRequest->id,
                'status' => 'failed',
                'intent' => 'action',
                'action' => $actionName,
                'error' => $result['error'],
                'explanation' => $result['error'],
            ], 422);
        }

        // Store the successful informational request
        $agentRequest = AgentRequest::create([
            'user_id' => $user->id,
            'user_input' => $userInput,
            'prompt' => json_encode($messages),
            'intent' => $parsed['intent'],
            'llm_response' => $llmResult['raw'],
            'parsed_action' => $parsed['raw'],
            'status' => 'done',
            'result' => json_encode($parsed['data']),
        ]);

        return response()->json([
            'agent_request_id' => $agentRequest->id,
            'intent' => $parsed['intent'],
            'explanation' => $parsed['explanation'],
            'data' => $parsed['data'],
            'reasoning' => $llmResult['reasoning'] ?? null,
        ], 200);
    }

    /**
     * Explicitly confirm or cancel a pending action.
     *
     * POST /api/assistant/confirm
     * Body: { "agent_request_id": 123, "confirm": true }
     */
    public function confirmAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'agent_request_id' => 'required|integer|exists:agent_requests,id',
            'confirm' => 'required|boolean',
        ]);

        $agentRequest = AgentRequest::where('id', $validated['agent_request_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$agentRequest) {
            return response()->json(['error' => 'Agent request not found or unauthorized'], 404);
        }

        if ($agentRequest->status !== 'pending_confirmation') {
            return response()->json([
                'error' => "Agent request status is '{$agentRequest->status}', expected 'pending_confirmation'",
            ], 400);
        }

        $parsedAction = $agentRequest->parsed_action;
        $actionName = $parsedAction['name'] ?? null;
        $params = $parsedAction['params'] ?? [];

        if (!$actionName) {
            return response()->json(['error' => 'No action found on pending request'], 422);
        }

        if (!$validated['confirm']) {
            $agentRequest->update([
                'status' => 'cancelled',
                'result' => json_encode(['cancelled' => true]),
            ]);

            return response()->json([
                'agent_request_id' => $agentRequest->id,
                'status' => 'cancelled',
                'action' => $actionName,
                'explanation' => "Action '{$actionName}' was cancelled by the user. No modifications were made.",
                'data' => null,
            ], 200);
        }

        $result = $this->actionExecutor->execute($actionName, $params, $request->user());

        if ($result['success']) {
            $agentRequest->update([
                'status' => 'done',
                'result' => json_encode($result['data']),
            ]);

            return response()->json([
                'agent_request_id' => $agentRequest->id,
                'status' => 'executed',
                'action' => $actionName,
                'explanation' => $result['message'],
                'data' => $result['data'],
            ], 200);
        }

        $agentRequest->update([
            'status' => 'failed',
            'error_log' => $result['error'],
        ]);

        return response()->json([
            'agent_request_id' => $agentRequest->id,
            'status' => 'failed',
            'action' => $actionName,
            'error' => $result['error'],
            'explanation' => "Action execution failed: {$result['error']}",
        ], 422);
    }

    /**
     * Get list of available assistant actions and metadata.
     *
     * GET /api/assistant/actions
     */
    public function actions(): JsonResponse
    {
        return response()->json([
            'actions' => $this->actionExecutor->getAvailableActions(),
        ]);
    }

    /**
     * Get a specific agent request by ID.
     *
     * GET /api/assistant/request/{agentRequest}
     */
    public function getRequest(Request $request, AgentRequest $agentRequest): JsonResponse
    {
        if ($agentRequest->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $agentRequest->id,
            'user_input' => $agentRequest->user_input,
            'status' => $agentRequest->status,
            'intent' => $agentRequest->intent,
            'parsed_action' => $agentRequest->parsed_action,
            'result' => $agentRequest->result ? json_decode($agentRequest->result, true) : null,
            'error_log' => $agentRequest->error_log,
            'created_at' => $agentRequest->created_at,
        ]);
    }

    /**
     * Get the authenticated user's conversation history (paginated).
     *
     * GET /api/assistant/history?per_page=15
     */
    public function history(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        $history = AgentRequest::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(min($perPage, 50));

        return response()->json($history);
    }
}