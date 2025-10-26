<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BudgetRequestSignature extends Model
{
    protected $table = 'budget_request_signatures';

    protected $fillable = [
        'budget_request_id',
        'user_id',
        'role',
        'signature_data',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'position_x' => 'float',
        'position_y' => 'float',
    ];

    public function budgetRequest()
    {
        return $this->belongsTo(BudgetRequest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
