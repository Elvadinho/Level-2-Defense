<?php

namespace Modules\Attendance\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Modules\Attendance\Enums\AttendanceStatus;
use Modules\Attendance\Models\Attendance;
use Modules\Employee\Models\Employee;
use Modules\Notification\Services\NotificationService;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceService
{
    private const QR_CACHE_KEY = 'attendance:qr_token';

    private const PERIOD_SECONDS = [
        'day' => 86400,
        'week' => 604800,
        'month' => 2592000,
    ];

    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

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
            'check_in_distance' => $distance,
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
            'check_out_distance' => $distance,
            'check_out_latitude' => $latitude,
            'check_out_longitude' => $longitude,
        ]);

        return $attendance;
    }

    // ── Remote Check-in ──────────────────────────────────────────────

    /**
     * Request a remote check-in. If the employee's user has the
     * remote_checkin_authorized flag set, the check-in is approved
     * immediately. Otherwise, a pending attendance record is created
     * and a fraud alert notification is sent to all HR managers.
     */
    public function remoteCheckIn(Employee $employee, string $reason, ?float $latitude = null, ?float $longitude = null): Attendance
    {
        $today = Carbon::today()->toDateString();

        // Prevent double check-in
        $existing = Attendance::where('employee_id', $employee->id)
            ->whereDate('date', $today)
            ->first();

        if ($existing) {
            throw new \RuntimeException('You already have an attendance record for today.');
        }

        $user = $employee->user;
        $isAuthorized = $user && $user->remote_checkin_authorized;

        $lateHour = (int)env('ATTENDANCE_LATE_HOUR', 8);
        $status = Carbon::now()->hour >= $lateHour ? AttendanceStatus::LATE : AttendanceStatus::PRESENT;

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'date' => $today,
            'check_in_time' => Carbon::now()->toTimeString(),
            'status' => $isAuthorized ? $status->value : 'present',
            'is_remote' => true,
            'remote_reason' => $reason,
            'remote_status' => $isAuthorized ? 'approved' : 'pending',
            'check_in_latitude' => $latitude,
            'check_in_longitude' => $longitude,
        ]);

        if (!$isAuthorized) {
            // Send fraud alert to all HR managers and admins
            $this->notifyHrOfUnauthorizedRemote($employee, $reason);
        }

        return $attendance->load('employee.user');
    }

    /**
     * Notify all HR managers / admins about an unauthorized remote check-in attempt.
     */
    private function notifyHrOfUnauthorizedRemote(Employee $employee, string $reason): void
    {
        $userName = $employee->user?->name ?? "Employee #{$employee->id}";

        $hrUsers = User::where(function ($q) {
            $q->where('role', 'hr_manager')
              ->orWhere('role', 'admin');
        })->pluck('id')->toArray();

        if (empty($hrUsers)) {
            return;
        }

        $this->notificationService->sendToUsers(
            $hrUsers,
            'attendance_fraud_alert',
            '⚠️ Unauthorized Remote Check-in Attempt',
            "{$userName} attempted a remote check-in without authorization. Reason given: \"{$reason}\". Please review and approve or reject this request from the Attendance module.",
            [
                'employee_id' => $employee->id,
                'employee_name' => $userName,
                'reason' => $reason,
                'date' => Carbon::today()->toDateString(),
            ],
            'in_app'
        );
    }

    /**
     * Get all pending remote check-in requests (HR / Admin).
     */
    public function getPendingRemoteRequests(): Collection
    {
        return Attendance::with(['employee.user', 'approver'])
            ->where('is_remote', true)
            ->where('remote_status', 'pending')
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Approve a remote check-in request.
     */
    public function approveRemoteRequest(int $attendanceId, User $approver): Attendance
    {
        $attendance = Attendance::findOrFail($attendanceId);

        if (!$attendance->is_remote || $attendance->remote_status !== 'pending') {
            throw new \RuntimeException('This record is not a pending remote check-in request.');
        }

        $attendance->update([
            'remote_status' => 'approved',
            'remote_approved_by' => $approver->id,
        ]);

        // Notify the employee that their request was approved
        $employeeUser = $attendance->employee?->user;
        if ($employeeUser) {
            $this->notificationService->send(
                $employeeUser,
                'remote_checkin_approved',
                '✅ Remote Check-in Approved',
                "Your remote check-in request for {$attendance->date->format('M d, Y')} has been approved by {$approver->name}.",
                ['attendance_id' => $attendance->id],
                'in_app'
            );
        }

        return $attendance->load(['employee.user', 'approver']);
    }

    /**
     * Reject a remote check-in request and remove the attendance record.
     */
    public function rejectRemoteRequest(int $attendanceId, User $rejector, string $reason): Attendance
    {
        $attendance = Attendance::findOrFail($attendanceId);

        if (!$attendance->is_remote || $attendance->remote_status !== 'pending') {
            throw new \RuntimeException('This record is not a pending remote check-in request.');
        }

        $attendance->update([
            'remote_status' => 'rejected',
            'remote_approved_by' => $rejector->id,
            'remote_rejection_reason' => $reason,
            'status' => AttendanceStatus::ABSENT->value,
            'check_in_time' => null,
        ]);

        // Notify the employee that their request was rejected
        $employeeUser = $attendance->employee?->user;
        if ($employeeUser) {
            $this->notificationService->send(
                $employeeUser,
                'remote_checkin_rejected',
                '❌ Remote Check-in Rejected',
                "Your remote check-in request for {$attendance->date->format('M d, Y')} was rejected by {$rejector->name}. Reason: {$reason}",
                ['attendance_id' => $attendance->id, 'reason' => $reason],
                'in_app'
            );
        }

        return $attendance->load(['employee.user', 'approver']);
    }

    // ── Queries ───────────────────────────────────────────────────────

    /**
     * Get attendance history for a specific employee (with relationships).
     */
    public function getHistoryByEmployee(int $employee): Collection
    {
        return Attendance::with('employee.user')
            ->where('employee_id', $employee)
            ->orderBy('date', 'desc')
            ->get();
    }

    /**
     * Get all attendance records (HR / Admin).
     */
    public function getAll(): Collection
    {
        return Attendance::with('employee.user')
            ->orderBy('date', 'desc')
            ->get();
    }

    // ── CSV Export ────────────────────────────────────────────────────

    /**
     * Generate a CSV export of all attendance records (HR / Admin).
     */
    public function exportCsv(): StreamedResponse
    {
        $records = Attendance::with('employee.user')
            ->orderBy('date', 'desc')
            ->get();

        return response()->streamDownload(function () use ($records) {
            $handle = fopen('php://output', 'w');

            // Header row
            fputcsv($handle, [
                'Employee',
                'Date',
                'Clock In',
                'Clock Out',
                'Work Hours',
                'Status',
                'Remote',
                'Remote Status',
                'Distance (m)',
            ]);

            foreach ($records as $record) {
                $employeeName = $record->employee?->user?->name ?? "Staff #{$record->employee_id}";
                $workHours = '';
                if ($record->check_in_time && $record->check_out_time) {
                    $checkIn = Carbon::parse($record->check_in_time);
                    $checkOut = Carbon::parse($record->check_out_time);
                    $diff = $checkIn->diff($checkOut);
                    $workHours = sprintf('%dh %dm', $diff->h, $diff->i);
                }

                fputcsv($handle, [
                    $employeeName,
                    $record->date?->format('Y-m-d') ?? '',
                    $record->check_in_time ?? '',
                    $record->check_out_time ?? '',
                    $workHours,
                    $record->status?->value ?? '',
                    $record->is_remote ? 'Yes' : 'No',
                    $record->remote_status ?? '',
                    $record->check_in_distance ?? '',
                ]);
            }

            fclose($handle);
        }, 'attendance-export-' . now()->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Calculate the distance from the configured office location.
     *
     * Uses the Haversine formula to calculate the distance
     * between two points on Earth.
     *
     * NOTE: This method no longer rejects check-ins based on distance.
     * Distance is recorded for informational / demo purposes.
     *
     * @return float The distance in meters
     */
    private function verifyLocation(float $latitude, float $longitude): float
    {
        $officeLat = (float)env('OFFICE_LATITUDE', 0);
        $officeLng = (float)env('OFFICE_LONGITUDE', 0);

        return $this->haversineDistance($officeLat, $officeLng, $latitude, $longitude);
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
