<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class PostImage extends Model
{
    protected $fillable = [
        'imageable_type',
        'imageable_id',
        'path',
        'original_name', 
        'mime_type',
        'size',
        'width',
        'height',
        'order'
    ];

    protected $casts = [
        'size' => 'integer',
        'width' => 'integer', 
        'height' => 'integer',
        'order' => 'integer'
    ];

    public function imageable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getUrlAttribute(): string
    {
        // Ensure we use the public disk for URL generation
        return asset('storage/' . $this->path);
    }

    public function getFullPathAttribute(): string
    {
        return Storage::path($this->path);
    }

    public function deleteFile(): bool
    {
        if (Storage::exists($this->path)) {
            return Storage::delete($this->path);
        }
        return true;
    }

    protected static function boot()
    {
        parent::boot();
        
        static::deleting(function ($image) {
            $image->deleteFile();
        });
    }
}