<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipmentRequest extends Model
{
    use HasFactory;

    protected $table = 'equipment_requests';

    protected $fillable = [
        'user_id',
        'activity_plan_id',
        'purpose',
        'category',
        'status',
        'start_datetime',
        'end_datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(EquipmentRequestItem::class);
    }

    public function approvals()
    {
        return $this->hasMany(RequestApproval::class, 'request_id')
            ->where('request_type', 'equipment');
    }
}
