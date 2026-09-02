<?php

namespace Modules\Payment\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'invoice_id' => 'required|exists:invoices,id',
            'channel' => 'required|in:cm.mtn,cm.orange,cm.card',
            'phone' => 'required_unless:channel,cm.card|nullable|string|regex:/^\+?237[0-9]{9}$/',
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'channel.in' => 'Channel must be cm.mtn (MTN MoMo), cm.orange (Orange Money), or cm.card (Visa/Mastercard)',
            'phone.regex' => 'Phone must be a valid Cameroon number (e.g., +237690000000)',
        ];
    }
}
