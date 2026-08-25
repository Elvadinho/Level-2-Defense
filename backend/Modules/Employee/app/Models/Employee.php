<?php

namespace Modules\Employee\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Enums\EmploymentStatus;

// use Modules\Employee\Database\Factories\EmployeeFactory;

class Employee extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'department_id',
        'job_title',
        'employment_status',
        'hire_date',
    ];

    // protected static function newFactory(): EmployeeFactory
    // {
    //     // return EmployeeFactory::new();
    // }

    protected function casts(): array
    {
        return [
            'employment_status' => EmploymentStatus::class,
            'hire_date' => 'date',
        ];
    }

//    An employee belongs to a user account
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

//    An employee belongs to a department
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
