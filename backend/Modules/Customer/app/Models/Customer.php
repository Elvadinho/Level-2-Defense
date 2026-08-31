<?php
namespace Modules\Customer\Models;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// use Modules\Customer\Database\Factories\CustomerFactory;

class Customer extends Model
{
    use HasFactory;

    /**     
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'contact_name',
        'email',
        'phone',
        'address',
        'city',
        'country',
    ];

    // protected static function newFactory(): CustomerFactory
    // {
    //     // return CustomerFactory::new();
    // }

    /**
     * A customer may be linked to a user account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
