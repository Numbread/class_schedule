<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): Response
    {
        $home = config('fortify.home');

        // For XHR/Inertia requests, return a redirect response
        // Inertia will handle this as a client-side navigation
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return redirect()->intended($home);
        }

        // For regular requests, do a standard redirect
        return redirect()->intended($home);
    }
}
