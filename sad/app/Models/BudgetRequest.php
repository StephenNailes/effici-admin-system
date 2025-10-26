<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetRequest extends Model
{
    use HasFactory;

    protected $table = 'budget_requests';

    protected $fillable = [
        'user_id',
        'request_name',
        'category',
        'status',
        'current_file_id',
        'pdf_path',
    ];

    public function files()
    {
        return $this->hasMany(BudgetRequestFile::class, 'budget_request_id');
    }

    public function currentFile()
    {
        return $this->belongsTo(BudgetRequestFile::class, 'current_file_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function signatures()
    {
        return $this->hasMany(BudgetRequestSignature::class, 'budget_request_id');
    }
}
