<?php

namespace Modules\Quotation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuotationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        // For updates, we just update the status/notes
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'status' => 'sometimes|in:draft,sent,accepted,rejected',
                'notes' => 'sometimes|nullable|string',
            ];
        }

        // For creation, we require the full quotation with items
        return [
            'customer_id' => 'required|exists:customers,id',

            // IT Project specifics
            'project_name' => 'required|string',
            'project_type' => 'required|string',
            'technology_stack' => 'nullable|json',
            'estimated_duration' => 'nullable|string',

            'quotation_date' => 'required|date',
            'valid_until' => 'required|date|after_or_equal:quotation_date',
            'notes' => 'nullable|string',

            // Items
            'items' => 'required|array|min:1',
            'items.*.service_category' => 'required|string',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'required|string',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
}
