<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleUpdateRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'requested_role',
        'officer_organization',
        'officer_position',
        'election_date',
        'term_duration',
        'reason',
        'status', // pending | approved | rejected
        'reviewed_by',
        'reviewed_at',
        'remarks',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'election_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
