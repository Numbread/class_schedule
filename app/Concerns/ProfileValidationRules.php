<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'fname' => $this->fnameRules(),
            'mname' => $this->mnameRules(),
            'lname' => $this->lnameRules(),
            'email' => $this->emailRules($userId),
            'timezone' => $this->timezoneRules(),
        ];
    }

    /**
     * Get the validation rules used to validate first names.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function fnameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate middle names.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function mnameRules(): array
    {
        return ['nullable', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate last names.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function lnameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Get the validation rules used to validate timezone.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function timezoneRules(): array
    {
        return ['nullable', 'string', 'max:50'];
    }
}
