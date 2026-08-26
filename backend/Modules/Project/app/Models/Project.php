<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Employee\Models\Employee;
use Modules\Project\Enums\ProjectStatus;
use Modules\Task\Models\Task;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'description',
        'status',
        'start_date',
        'end_date',
        'manager_id',
        'customer_id',
    ];

    // protected static function newFactory(): ProjectFactory
    // {
    //     // return ProjectFactory::new();
    // }

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    // The employee who manages this project
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    // Employees assigned to this project(via pivot)
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    // All tasks under this project
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
