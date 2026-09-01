<?php

namespace Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Invoice\Http\Requests\InvoiceRequest;
use Modules\Invoice\Services\InvoiceService;

class InvoiceController extends Controller
{
    public function __construct(private InvoiceService $invoiceService)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->invoiceService->getAll());
    }

    public function store(InvoiceRequest $request): JsonResponse
    {
        $invoice = $this->invoiceService->create($request->validated());
        return response()->json($invoice, 201);
    }

    public function show($id): JsonResponse
    {
        return response()->json($this->invoiceService->getById($id));
    }

    public function update(InvoiceRequest $request, $id): JsonResponse
    {
        $invoice = $this->invoiceService->updateStatus($id, $request->validated());
        return response()->json($invoice, 200);
    }

    public function destroy($id): JsonResponse
    {
        $this->invoiceService->delete($id);
        return response()->json(['message' => 'Invoice deleted successfully'], 200);
    }
}
