<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, MustVerifyEmailTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'role', // student | admin_assistant | dean
        'profile_picture',
        'school_id_number',
        'date_of_birth',
        'address',
        'city',
        'province',
        'region',
        'contact_number',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'date_of_birth' => 'date',
    ];

    /**
     * Relationships
     */

    // A user can have many activity plans
    public function activityPlans()
    {
        return $this->hasMany(ActivityPlan::class);
    }

    // A user can have many equipment requests
    public function equipmentRequests()
    {
        return $this->hasMany(EquipmentRequest::class);
    }

    // A user can be an approver in many approvals (admin_assistant or dean)
    public function approvals()
    {
        return $this->hasMany(RequestApproval::class, 'approver_id');
    }

    // A user can have many comments
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Accessors / Helpers
     */

    public function getFullNameAttribute(): string
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= " {$this->middle_name}";
        }
        $name .= " {$this->last_name}";
        return $name;
    }

    public function getProfilePictureUrlAttribute(): ?string
    {
        if (!$this->profile_picture) {
            return null;
        }

        // If already a full URL, return as is
        if (str_starts_with($this->profile_picture, 'http://') || 
            str_starts_with($this->profile_picture, 'https://') ||
            str_starts_with($this->profile_picture, 'data:') ||
            str_starts_with($this->profile_picture, 'blob:')) {
            return $this->profile_picture;
        }

        // Generate storage URL
        return asset('storage/' . $this->profile_picture);
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isAssistant(): bool
    {
        return $this->role === 'admin_assistant';
    }

    public function isDean(): bool
    {
        return $this->role === 'dean';
    }
}
