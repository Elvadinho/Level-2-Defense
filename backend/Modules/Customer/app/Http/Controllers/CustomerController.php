<?php

namespace Modules\Customer\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Customer\Http\Requests\CustomerRequest;
use Modules\Customer\Models\Customer;
use Modules\Customer\Services\CustomerService;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $CustomerService)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->CustomerService->getAll());
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        $customer = $this->CustomerService->create($request->validated());
        return response()->json($customer->load('user'), 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer->load('user'));
    }

    public function update(CustomerRequest $request, Customer $customer): JsonResponse
    {
        $updated = $this->CustomerService->update($customer, $request->validated());
        return response()->json($updated->load('user'));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->CustomerService->delete($customer);
        return response()->json(['message' => 'Customer deleted successfully.']);
    }
}
