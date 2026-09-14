<?php

namespace Modules\Attendance\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Modules\Attendance\Enums\AttendanceStatus;
use Modules\Attendance\Models\Attendance;
use Modules\Employee\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

class AttendanceService
{
    private const QR_CACHE_KEY = 'attendance:qr_token';

    private const PERIOD_SECONDS = [
        'day' => 86400,
        'week' => 604800,
        'month' => 2592000,
    ];

    /**
     * Generate a new random office QR token valid for the given period
     * ('day', 'week', or 'month') and store it as the only currently
     * valid token, so it can be printed/displayed for that whole period.
     *
     * @return array{token: string, period: string, expires_at: \Illuminate\Support\Carbon}
     */
    public function generateQrToken(string $period = 'day'): array
    {
        $ttlSeconds = self::PERIOD_SECONDS[$period] ?? self::PERIOD_SECONDS['day'];
        $period = array_key_exists($period, self::PERIOD_SECONDS) ? $period : 'day';

        $token = Str::random(48);
        $expiresAt = now()->addSeconds($ttlSeconds);
        Cache::put(self::QR_CACHE_KEY, $token, $expiresAt);

        return ['token' => $token, 'period' => $period, 'expires_at' => $expiresAt];
    }

    /**
     * @throws \RuntimeException if the scanned QR code is missing, stale, or does not
     *         match the token currently displayed at the office kiosk.
     */
    private function verifyQrToken(string $qrCode): void
    {
        if (Cache::get(self::QR_CACHE_KEY) !== $qrCode) {
            throw new \RuntimeException('Invalid or expired QR code. Please scan the code currently displayed at the office.');
        }
    }

    /**
     * Check in the authenticated employee.
     *
     * @param Employee $employee The employee (derived from auth token)
     * @param float $latitude GPS latitude from the phone
     * @param float $longitude GPS longitude from the phone
     * @param string $qrCode Token decoded from the office QR kiosk
     */
    public function checkIn(Employee $employee, float $latitude, float $longitude, string $qrCode): Attendance
    {
        $this->verifyQrToken($qrCode);

        //      verify geolocation and catch the distance
        $distance = $this->verifyLocation($latitude, $longitude);

        //      Prevent double check
        $today = Carbon::today()->toDateString();

        $existing = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->first();

        if ($existing) {
            throw new \RuntimeException('You have already checked in today.');
        }

        //      Determine if late
        $lateHour = (int)env('ATTENDANCE_LATE_HOUR', 8);
        $status = Carbon::now()->hour >= $lateHour ? AttendanceStatus::LATE : AttendanceStatus::PRESENT;

        return Attendance::create([
            'employee_id' => $employee->id,
            'date' => $today,
            'check_in_time' => Carbon::now()->toTimeString(),
            'status' => $status->value,
            'check_in_distance' => $distance, // <-- Add this line
            'check_in_latitude' => $latitude,
            'check_in_longitude' => $longitude,
        ]);
    }

    public function checkOut(Employee $employee, float $latitude, float $longitude, string $qrCode): Attendance
    {
        $this->verifyQrToken($qrCode);

        //      Verify geolocation
        $distance = $this->verifyLocation($latitude, $longitude);

        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->first();

        //      Must check in before checking out
        if (!$attendance) {
            throw new \RuntimeException('You have not checked in today.');
        }

        //      Prevent double checkout
        if ($attendance->check_out_time) {
            throw new \RuntimeException('You have already checked out today.');
        }

        $attendance->update([
            'check_out_time' => Carbon::now()->toTimeString(),
            'check_out_distance' => $distance, // <-- Add this line
            'check_out_latitude' => $latitude,
            'check_out_longitude' => $longitude,
        ]);

        return $attendance;
    }

    //  Get attendance history for a specific employee
    public function getHistoryByEmployee(int $employee): Collection
    {
        return Attendance::where('employee_id', $employee)
            ->orderBy('date', 'desc')
            ->get();
    }

    //  Get all attendance records(HR / Admin)
    public function getAll(): Collection
    {
        return Attendance::with('employee.user')
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Verify that the given GPS coordinates are within the allowed
     * radius of the office location.
     *
     * Uses the Haversine formula to calculate the distance
     * between two points on Earth.
     *
     * @throws \RuntimeException if too far from office
     */
    /**
     * @return float The distance in meters
     */
    private function verifyLocation(float $latitude, float $longitude): float
    {
        $officeLat = (float)env('OFFICE_LATITUDE');
        $officeLng = (float)env('OFFICE_LONGITUDE');
        $maxRadius = (float)env('OFFICE_RADIUS_METERS', 200);

        $distance = $this->haversineDistance($officeLat, $officeLng, $latitude, $longitude);

        if ($distance > $maxRadius) {
            throw new \RuntimeException(
                "You are too far from the office. Distance: " . round($distance) . "m (max: {$maxRadius}m)."
            );
        }

        return $distance; // <-- We return it now!
    }


    /**
     * Calculate the distance in meters between two GPS coordinates
     * using the Haversine formula.
     *
     * The Haversine formula determines the great-circle distance
     * between two points on a sphere given their latitudes and longitudes.
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // Earth's radius in meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
