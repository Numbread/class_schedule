<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'user_type' => ['required', Rule::in(['scheduler', 'faculty'])],
            'department_id' => ['required', 'exists:departments,id'],
            'specialization' => ['nullable', 'string', Rule::in(array_keys(User::getSpecializationOptions()))],
        ], [
            'department_id.required' => 'Please select your department.',
            'user_type.required' => 'Please select your role.',
        ])->validate();

        return User::create([
            'fname' => $input['fname'],
            'mname' => $input['mname'] ?? null,
            'lname' => $input['lname'],
            'email' => $input['email'],
            'password' => $input['password'],
            'user_type' => $input['user_type'],
            'department_id' => $input['department_id'],
            'specialization' => $input['specialization'] ?? null,
            'approval_status' => 'pending', // Requires admin approval
            'is_active' => false, // Not active until approved
        ]);
    }
}
