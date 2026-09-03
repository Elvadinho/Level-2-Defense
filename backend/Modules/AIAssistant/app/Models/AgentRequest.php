<?php

namespace Modules\AIAssistant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
// use Modules\AIAssistant\Database\Factories\AgentRequestFactory;

class AgentRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'user_input',
        'prompt',
        'intent',
        'llm_response',
        'parsed_action',
        'status',
        'result',
        'error_log'
    ];

    // protected static function newFactory(): AgentRequestFactory
    // {
    //     // return AgentRequestFactory::new();
    // }

    protected function casts(): array
    {
        return [
            'llm_response' => 'array',
            'parsed_action' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
