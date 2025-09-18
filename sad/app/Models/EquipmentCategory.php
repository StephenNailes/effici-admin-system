<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentCategory extends Model
{
    protected $table = 'equipment_categories';
    protected $fillable = ['name'];
}
