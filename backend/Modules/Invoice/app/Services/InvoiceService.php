<?php

namespace Modules\Invoice\Services;

use Modules\Invoice\Models\Invoice;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function getAll(): Collection
    {
        return Invoice::with('customer')->orderBy('created_at', 'desc')->get();
    }

    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $subtotal = 0;

            // Calculate subtotal from items
            foreach ($data['items'] as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            // Calculate tax and total
            $taxRate = $data['tax_rate'] ?? 0;
            $taxAmount = $subtotal * ($taxRate / 100);
            $totalAmount = $subtotal + $taxAmount;

            // Create Invoice
            $invoice = Invoice::create([
                'customer_id' => $data['customer_id'],
                'quotation_id' => $data['quotation_id'] ?? null,
                'invoice_number' => $data['invoice_number'],
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create Items
            foreach ($data['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $invoice->items()->create([
                    'service_category' => $item['service_category'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? 'Flat Rate',
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return $invoice->load('items', 'customer');
        });
    }

    public function getById(int $id): Invoice
    {
        return Invoice::with('items', 'customer')->findOrFail($id);
    }

    public function updateStatus(int $id, array $data): Invoice
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->update($data);

        return $invoice;
    }

    public function delete(int $id): void
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();
    }
}
