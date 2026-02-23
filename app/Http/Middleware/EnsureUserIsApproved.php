<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Check if user is approved (NULL or 'approved' means approved - for backwards compatibility)
        if ($user->approval_status === 'pending') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect()->route('login')
                ->with('error', 'Your account is pending approval. Please wait for an administrator to approve your registration.');
        }

        if ($user->approval_status === 'rejected') {
            $reason = $user->rejection_reason ?? 'No reason provided';
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect()->route('login')
                ->with('error', "Your registration was rejected. Reason: {$reason}");
        }

        return $next($request);
    }
}
