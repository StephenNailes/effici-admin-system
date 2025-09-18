<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipment';

    protected $fillable = [
        'name',
        'description',
        'total_quantity',
        'available_quantity',
    ];

    public function items()
    {
        return $this->hasMany(EquipmentRequestItem::class);
    }

    public function category()
    {
        return $this->belongsTo(EquipmentCategory::class, 'category_id');
    }
}

