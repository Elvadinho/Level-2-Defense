<?php

namespace Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Invoice\Database\Factories\InvoiceItemFactory;

class InvoiceItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'invoice_id',
        'service_category',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'subtotal',
    ];

    // protected static function newFactory(): InvoiceItemFactory
    // {
    //     // return InvoiceItemFactory::new();
    // }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
