<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LogoutResponse implements LogoutResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): Response
    {
        $home = '/';

        // For Inertia requests, use Inertia::location for a full page redirect
        if ($request->header('X-Inertia')) {
            return redirect($home);
        }

        // For XHR requests that expect JSON
        if ($request->wantsJson()) {
            return response()->json(['redirect' => $home]);
        }

        // For regular requests, do a standard redirect
        return redirect($home);
    }
}
