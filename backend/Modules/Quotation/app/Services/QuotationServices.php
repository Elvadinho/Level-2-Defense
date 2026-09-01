<?php
namespace Modules\Quotation\Services;
use Modules\Quotation\Models\Quotation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class QuotationServices
{
    public function getAll(): Collection
    {
        return Quotation::with('customer')->orderBy('created_at', 'desc')->get();
    }

    public function create(array $data): Quotation
    {
        return DB::transaction(function () use ($data) {
            $totalAmount = 0;

            // calculate total based on items
            foreach ($data['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $quotation = Quotation::create([
                'customer_id' => $data['customer_id'],
                'project_name' => $data['project_name'],
                'project_type' => $data['project_type'],
                // Decode JSON string back to array if present for insertion, Model casts it back to JSON
                'technology_stack' => isset($data['technology_stack']) ? json_decode($data['technology_stack'], true) : null,
                'estimated_duration' => $data['estimated_duration'] ?? null,
                'quotation_date' => $data['quotation_date'],
                'valid_until' => $data['valid_until'],
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create Items
            foreach ($data['items'] as $item) {
                $quotation->items()->create([
                    'service_category' => $item['service_category'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit' => $item['unit'] ?? 'Flat Rate',
                    'unit_price' => $item['unit_price'],
                ]);
            }

            return $quotation->load('items', 'customer');
        });
    }

    public function getById(int $id): Quotation
    {
        return Quotation::with('items', 'customer')->findOrFail($id);
    }

    public function updateStatus(int $id, array $data): Quotation
    {
        $quotation = Quotation::findOrFail($id);
        $quotation->update($data);

        return $quotation;
    }

    public function delete(int $id): void
    {
        $quotation = Quotation::findOrFail($id);
        $quotation->delete();
    }
}