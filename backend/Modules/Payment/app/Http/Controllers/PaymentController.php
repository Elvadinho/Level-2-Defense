<?php

namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;
use Modules\Payment\Http\Requests\PaymentRequest;
use Modules\Payment\Services\PaymentService;
use Modules\Payment\Contracts\PaymentGatewayInterface;
use Modules\Customer\Models\Customer;
use Modules\Invoice\Models\Invoice;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private ?PaymentGatewayInterface $gateway = null
    ) {
        $this->gateway = $gateway ?? app(PaymentGatewayInterface::class);
    }

    /**
     * List all payments.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role?->value === 'customer') {
            $customerId = Customer::where('user_id', $request->user()->id)->value('id');
            return response()->json($customerId ? $this->paymentService->getForCustomer($customerId) : []);
        }

        if (!in_array($request->user()->role?->value, ['admin', 'accountant'], true)) {
            return response()->json(['error' => 'Only finance staff can view all payments.'], 403);
        }

        return response()->json($this->paymentService->getAll());
    }

    /**
     * Initiate a new payment.
     * Mobile money: NotchPay sends a MoMo prompt. Card: response includes authorization_url.
     */
    public function store(PaymentRequest $request): JsonResponse
    {
        try {
            if (!in_array($request->user()->role?->value, ['admin', 'accountant', 'customer'], true)) {
                return response()->json(['error' => 'You are not allowed to initiate payments.'], 403);
            }
            if ($request->user()->role?->value === 'customer') {
                $validated = $request->validated();
                $ownsInvoice = Invoice::where('id', $validated['invoice_id'])
                    ->whereHas('customer', fn ($query) => $query->where('user_id', $request->user()->id))
                    ->exists();
                if (!$ownsInvoice) {
                    return response()->json(['error' => 'You can only pay invoices issued to your account.'], 403);
                }
            }
            $payment = $this->paymentService->initiatePayment($request->validated());
            return response()->json($payment, 201);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Get a single payment.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $payment = $this->paymentService->getById($id);
        if ($request->user()->role?->value === 'customer' && $payment->customer?->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        if (!in_array($request->user()->role?->value, ['admin', 'accountant', 'customer'], true)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return response()->json($payment);
    }

    /**
     * NotchPay redirects the customer here after card checkout.
     */
    public function callback(Request $request): Response
    {
        $reference = $request->query('reference') ?? $request->query('trxref');

        if (!$reference) {
            return response()->json(['error' => 'Missing payment reference'], 422);
        }

        try {
            $payment = $this->paymentService->verifyByNotchPayReference($reference);

            // API callers and automated tests need JSON; a real browser should go
            // back to the React payments screen after the status is verified.
            if ($request->expectsJson() || !config('app.frontend_url')) {
                return response()->json($payment);
            }

            return redirect()->away(
                rtrim((string) config('app.frontend_url'), '/')
                . '/payments?payment=' . $payment->id
                . '&status=' . urlencode((string) $payment->status)
            );
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Manually verify a payment status against NotchPay.
     */
    public function verify(Request $request, $id): JsonResponse
    {
        if (!in_array($request->user()->role?->value, ['admin', 'accountant'], true)) {
            return response()->json(['error' => 'Only finance staff can verify payments.'], 403);
        }
        try {
            $payment = $this->paymentService->verifyPayment($id);
            return response()->json($payment);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Webhook endpoint — Payment gateway calls this when payment status changes.
     * This route should NOT require auth:api middleware.
     */
    public function webhook(Request $request, ?PaymentGatewayInterface $gateway = null): JsonResponse
    {
        $activeGateway = $gateway ?? $this->gateway ?? app(PaymentGatewayInterface::class);

        // Verify the webhook signature
        $signature = $request->header('x-notch-signature')
            ?? $request->header('verif-hash')
            ?? $request->header('x-paystack-signature')
            ?? $request->header('stripe-signature')
            ?? '';

        $payload = $request->getContent();

        if (!$activeGateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $this->paymentService->handleWebhook($request->all());

        return response()->json(['message' => 'Webhook received'], 200);
    }
}
