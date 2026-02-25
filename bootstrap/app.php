<?php

use App\Http\Middleware\EnsureUserIsApproved;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware alias
        $middleware->alias([
            'approved' => EnsureUserIsApproved::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle 419 CSRF token expiration for Inertia requests
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            if ($exception instanceof \Illuminate\Session\TokenMismatchException) {
                // For Inertia requests, return a JSON response that the client can handle
                if ($request->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Your session has expired. Please refresh the page.',
                    ], 419)->header('X-Inertia-Location', $request->fullUrl());
                }

                // For regular AJAX requests
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Your session has expired. Please refresh the page.',
                    ], 419);
                }
            }

            // Always return the original response for unhandled exceptions
            return $response;
        });
    })->create();
