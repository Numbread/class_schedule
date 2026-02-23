<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class TimezoneService
{
    /**
     * Get the user's timezone or default to UTC.
     */
    public function getUserTimezone(): string
    {
        $user = Auth::user();
        return $user?->timezone ?? config('app.timezone', 'UTC');
    }

    /**
     * Auto-detect timezone from browser (returns common timezones list for selection).
     */
    public function getCommonTimezones(): array
    {
        return [
            'UTC' => 'UTC (Coordinated Universal Time)',
            'America/New_York' => 'Eastern Time (US & Canada)',
            'America/Chicago' => 'Central Time (US & Canada)',
            'America/Denver' => 'Mountain Time (US & Canada)',
            'America/Los_Angeles' => 'Pacific Time (US & Canada)',
            'America/Manila' => 'Manila (Philippines)',
            'Asia/Singapore' => 'Singapore',
            'Asia/Hong_Kong' => 'Hong Kong',
            'Asia/Tokyo' => 'Tokyo (Japan)',
            'Asia/Seoul' => 'Seoul (South Korea)',
            'Asia/Dubai' => 'Dubai (UAE)',
            'Asia/Kolkata' => 'Kolkata (India)',
            'Europe/London' => 'London (UK)',
            'Europe/Paris' => 'Paris (France)',
            'Europe/Berlin' => 'Berlin (Germany)',
            'Europe/Madrid' => 'Madrid (Spain)',
            'Europe/Rome' => 'Rome (Italy)',
            'Australia/Sydney' => 'Sydney (Australia)',
            'Australia/Melbourne' => 'Melbourne (Australia)',
        ];
    }

    /**
     * Get all available timezones grouped by region.
     */
    public function getAllTimezones(): array
    {
        $timezones = [];
        $identifiers = timezone_identifiers_list();

        foreach ($identifiers as $timezone) {
            $parts = explode('/', $timezone);
            $region = $parts[0] ?? 'Other';

            if (!isset($timezones[$region])) {
                $timezones[$region] = [];
            }

            $timezones[$region][$timezone] = $this->formatTimezoneName($timezone);
        }

        ksort($timezones);
        foreach ($timezones as $region => $tzList) {
            asort($timezones[$region]);
        }

        return $timezones;
    }

    /**
     * Format timezone name for display.
     */
    protected function formatTimezoneName(string $timezone): string
    {
        $parts = explode('/', $timezone);
        $city = end($parts);
        $city = str_replace('_', ' ', $city);

        // Get offset
        try {
            $dt = new \DateTime('now', new \DateTimeZone($timezone));
            $offset = $dt->format('P');
            return "{$city} (UTC{$offset})";
        } catch (\Exception $e) {
            return $city;
        }
    }

    /**
     * Convert UTC datetime to user's timezone.
     */
    public function toUserTimezone($datetime, ?string $timezone = null): Carbon
    {
        if (!$datetime) {
            return Carbon::now();
        }

        $tz = $timezone ?? $this->getUserTimezone();

        if ($datetime instanceof Carbon) {
            return $datetime->copy()->setTimezone($tz);
        }

        if (is_string($datetime)) {
            return Carbon::parse($datetime, 'UTC')->setTimezone($tz);
        }

        return Carbon::parse($datetime)->setTimezone($tz);
    }

    /**
     * Convert user's timezone datetime to UTC.
     */
    public function toUtc($datetime, ?string $timezone = null): Carbon
    {
        if (!$datetime) {
            return Carbon::now('UTC');
        }

        $tz = $timezone ?? $this->getUserTimezone();

        if ($datetime instanceof Carbon) {
            return $datetime->copy()->setTimezone('UTC');
        }

        if (is_string($datetime)) {
            return Carbon::parse($datetime, $tz)->setTimezone('UTC');
        }

        return Carbon::parse($datetime)->setTimezone('UTC');
    }

    /**
     * Format datetime for display in user's timezone.
     */
    public function formatForUser($datetime, string $format = 'Y-m-d H:i:s', ?string $timezone = null): string
    {
        return $this->toUserTimezone($datetime, $timezone)->format($format);
    }

    /**
     * Get current time in user's timezone.
     */
    public function now(?string $timezone = null): Carbon
    {
        $tz = $timezone ?? $this->getUserTimezone();
        return Carbon::now($tz);
    }
}
