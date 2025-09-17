<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipmentRequestItem extends Model
{
    use HasFactory;

    protected $table = 'equipment_request_items';

    protected $fillable = [
        'equipment_request_id',
        'equipment_id',
        'quantity',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function request()
    {
        return $this->belongsTo(EquipmentRequest::class, 'equipment_request_id');
    }
}
