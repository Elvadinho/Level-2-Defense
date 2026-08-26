<?php

namespace Modules\Project\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

// use Modules\Project\Database\Factories\ProjectMemberFactory;

class ProjectMember extends pivot
{
    protected $table = 'project_members';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'employee_id',
        'role',
    ];

    // protected static function newFactory(): ProjectMemberFactory
    // {
    //     // return ProjectMemberFactory::new();
    // }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
