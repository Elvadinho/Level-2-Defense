<?php

namespace Modules\Quotation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Modules\Customer\Models\Customer;

// use Modules\Quotation\Database\Factories\QuotationFactory;

class Quotation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'customer_id',
        'project_name',
        'project_type',
        'technology_stack',
        'estimated_duration',
        'quotation_date',
        'valid_until',
        'total_amount',
        'status',
        'notes',
    ];

    // protected static function newFactory(): QuotationFactory
    // {
    //     // return QuotationFactory::new();
    // }

    protected $casts = [
        'technology_stack' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
    public function items()
    {
        return $this->hasMany(QuotationItem::class);
    }
}
