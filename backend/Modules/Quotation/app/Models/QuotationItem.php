<?php

namespace Modules\Quotation\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\Quotation\Database\Factories\QuotationItemFactory;

class QuotationItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'quotation_id',
        'service_category',
        'description',
        'quantity',
        'unit',
        'unit_price',
    ];

    // protected static function newFactory(): QuotationItemFactory
    // {
    //     // return QuotationItemFactory::new();
    // }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }
}
