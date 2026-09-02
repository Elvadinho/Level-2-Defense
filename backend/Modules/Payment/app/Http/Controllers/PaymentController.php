<?php

namespace Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Payment\Http\Requests\PaymentRequest;
use Modules\Payment\Services\PaymentService;
use Modules\Payment\Services\NotchPayGateway;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService)
    {
    }

    /**
     * List all payments.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->paymentService->getAll());
    }

    /**
     * Initiate a new payment.
     * Mobile money: NotchPay sends a MoMo prompt. Card: response includes authorization_url.
     */
    public function store(PaymentRequest $request): JsonResponse
    {
        try {
            $payment = $this->paymentService->initiatePayment($request->validated());
            return response()->json($payment, 201);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Get a single payment.
     */
    public function show($id): JsonResponse
    {
        return response()->json($this->paymentService->getById($id));
    }

    /**
     * NotchPay redirects the customer here after card checkout.
     */
    public function callback(Request $request): JsonResponse
    {
        $reference = $request->query('reference') ?? $request->query('trxref');

        if (!$reference) {
            return response()->json(['error' => 'Missing payment reference'], 422);
        }

        try {
            $payment = $this->paymentService->verifyByNotchPayReference($reference);
            return response()->json($payment);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Manually verify a payment status against NotchPay.
     */
    public function verify($id): JsonResponse
    {
        try {
            $payment = $this->paymentService->verifyPayment($id);
            return response()->json($payment);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }
    }

    /**
     * Webhook endpoint — NotchPay calls this when payment status changes.
     * This route should NOT require auth:api middleware.
     */
    public function webhook(Request $request, NotchPayGateway $gateway): JsonResponse
    {
        // Verify the webhook signature
        $signature = $request->header('x-notch-signature', '');
        $payload = $request->getContent();

        if (!$gateway->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $this->paymentService->handleWebhook($request->all());

        return response()->json(['message' => 'Webhook received'], 200);
    }
}
