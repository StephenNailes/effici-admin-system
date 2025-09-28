<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Event extends Model
{
    protected $fillable = ['title', 'date', 'description', 'created_by', 'user_id'];
    
    protected static function boot()
    {
        parent::boot();

        static::deleting(function (Event $event) {
            // Remove related comments and likes in DB
            $event->comments()->delete();
            $event->likes()->delete();

            // Delete images one-by-one so model events fire and files are removed from storage
            $event->images()->get()->each(function ($image) {
                $image->delete();
            });
        });
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function likes(): MorphMany
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function images(): MorphMany
    {
        return $this->morphMany(PostImage::class, 'imageable')->orderBy('order');
    }

    public function primaryImage(): ?PostImage
    {
        return $this->images()->where('order', 0)->first();
    }

    public function getLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    public function isLikedByUser($userId)
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }
}
