<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'fname',
        'mname',
        'lname',
        'email',
        'password',
        'user_type',
        'specialization',
        'department_id',
        'is_active',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'timezone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the department this user belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the admin who approved this user.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute(): string
    {
        $middleInitial = $this->mname ? ' ' . strtoupper(substr($this->mname, 0, 1)) . '.' : '';
        return $this->fname . $middleInitial . ' ' . $this->lname;
    }

    /**
     * Get the user's name for display (full name).
     */
    public function getNameAttribute(): string
    {
        return $this->full_name;
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    /**
     * Check if user is scheduler.
     */
    public function isScheduler(): bool
    {
        return $this->user_type === 'scheduler';
    }

    /**
     * Check if user is faculty.
     */
    public function isFaculty(): bool
    {
        return $this->user_type === 'faculty';
    }

    /**
     * Scope to get active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Deactivate the user account.
     */
    public function deactivate(): bool
    {
        return $this->update(['is_active' => false]);
    }

    /**
     * Activate the user account.
     */
    public function activate(): bool
    {
        return $this->update(['is_active' => true]);
    }

    /**
     * Check if user is approved.
     */
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    /**
     * Check if user is pending approval.
     */
    public function isPendingApproval(): bool
    {
        return $this->approval_status === 'pending';
    }

    /**
     * Check if user was rejected.
     */
    public function isRejected(): bool
    {
        return $this->approval_status === 'rejected';
    }

    /**
     * Approve this user.
     */
    public function approve(User $approver): bool
    {
        return $this->update([
            'approval_status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject this user.
     */
    public function reject(User $approver, string $reason): bool
    {
        return $this->update([
            'approval_status' => 'rejected',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Scope for pending approval users.
     */
    public function scopePendingApproval($query)
    {
        return $query->where('approval_status', 'pending');
    }

    /**
     * Scope for approved users.
     */
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    /**
     * Available specializations for faculty.
     */
    public static function getSpecializationOptions(): array
    {
        return [
            'CCAI' => 'CCAI (Cisco Certified)',
            'CS' => 'Computer Science',
            'CPE' => 'Computer Engineering',
            'IT' => 'Information Technology',
            'IS' => 'Information Systems',
            'LIS' => 'Library and Information Science',
            'GENERAL' => 'General',
        ];
    }
}
