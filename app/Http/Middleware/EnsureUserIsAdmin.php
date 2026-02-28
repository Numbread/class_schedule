<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'admin') {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized. This action is restricted to administrators.'], 403);
            }

            return redirect()->route('dashboard')
                ->with('error', 'Unauthorized. This action is restricted to administrators.');
        }

        return $next($request);
    }
}
