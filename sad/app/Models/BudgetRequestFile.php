<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BudgetRequestFile extends Model
{
    protected $fillable = [
        'budget_request_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_at',
        'document_data',
    ];

    public function budgetRequest()
    {
        return $this->belongsTo(BudgetRequest::class);
    }
}
