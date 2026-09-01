<?php
namespace Modules\Quotation\Http\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Quotation\Http\Requests\QuotationRequest;
use Modules\Quotation\Services\QuotationServices;

class QuotationController extends Controller
{
    public function __construct(private QuotationServices $quotationServices)
    {
    }
    public function index(): JsonResponse
    {
        return response()->json($this->quotationServices->getAll());
    }
    public function store(QuotationRequest $request): JsonResponse
    {
        $quotation = $this->quotationServices->create($request->validated());
        return response()->json($quotation, 201);
    }
    public function show($id): JsonResponse
    {
        return response()->json($this->quotationServices->getById($id));
    }
    public function update(QuotationRequest $request, $id): JsonResponse
    {
        $quotation = $this->quotationServices->updateStatus($id, $request->validated());
        return response()->json($quotation, 200);
    }
    public function destroy($id): JsonResponse
    {
        $this->quotationServices->delete($id);
        return response()->json(['message' => 'Quotation deleted successfully'], 200);
    }


}
