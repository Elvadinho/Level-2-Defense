<?php

namespace Modules\Attendance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Attendance\Enums\AttendanceStatus;
use Modules\Employee\Models\Employee;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'check_in_time',
        'check_out_time',
        'status',
        'check_in_distance',
        'check_out_distance',
        'check_in_latitude',
        'check_in_longitude',
        'check_out_latitude',
        'check_out_longitude',
        'check_in_ip',
        'check_out_ip',
        'fraud_flag',
        'fraud_reason',
        'is_remote',
        'remote_reason',
        'remote_status',
        'remote_approved_by',
        'remote_rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'status' => AttendanceStatus::class,
            'check_in_distance' => 'decimal:2',
            'check_out_distance' => 'decimal:2',
            'check_in_latitude' => 'decimal:7',
            'check_in_longitude' => 'decimal:7',
            'check_out_latitude' => 'decimal:7',
            'check_out_longitude' => 'decimal:7',
            'is_remote' => 'boolean',
            'fraud_flag' => 'boolean',
        ];
    }

    /**
     * An attendance record belongs to an employee.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * The user who approved a remote check-in request.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'remote_approved_by');
    }

    /**
     * Scope to only remote check-in requests with a given status.
     */
    public function scopeRemoteStatus($query, string $status)
    {
        return $query->where('is_remote', true)->where('remote_status', $status);
    }
}
