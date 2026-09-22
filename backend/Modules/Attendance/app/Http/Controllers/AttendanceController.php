<?php

namespace Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Attendance\Http\Requests\AttendanceRequest;
use Modules\Attendance\Services\AttendanceService;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    /**
     * List all attendance records (HR / Admin).
     * Supports optional ?employee_id= filter.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employeeId = $request->query('employee_id') ? (int)$request->query('employee_id') : null;

        return response()->json($this->attendanceService->getAll($employeeId));
    }

    /**
     * Check in employee identified from auth token.
     * Passes the client IP to the service for fraud detection.
     */
    public function checkIn(AttendanceRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        try {
            $attendance = $this->attendanceService->checkIn(
                $employee,
                $request->latitude,
                $request->longitude,
                $request->qr_code,
                $request->ip(),
            );

            return response()->json([
                'message' => 'Checked in successfully.',
                'attendance' => $attendance->load('employee.user'),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    /**
     * Check out employee identified from auth token.
     */
    public function checkOut(AttendanceRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }
        try {
            $attendance = $this->attendanceService->checkOut(
                $employee,
                $request->latitude,
                $request->longitude,
                $request->qr_code,
                $request->ip(),
            );
            return response()->json([
                'message' => 'Checked out successfully.',
                'attendance' => $attendance->load('employee.user'),
            ], 200);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    // ── Remote Check-in ──────────────────────────────────────────────

    public function remoteCheckIn(Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        try {
            $attendance = $this->attendanceService->remoteCheckIn(
                $employee,
                $request->reason,
                $request->latitude,
                $request->longitude
            );

            $message = $attendance->remote_status === 'approved' 
                ? 'Remote check-in successful.' 
                : 'Remote check-in request submitted for HR approval.';

            return response()->json([
                'message' => $message,
                'attendance' => $attendance,
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    public function pendingRemoteRequests(Request $request): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($this->attendanceService->getPendingRemoteRequests());
    }

    public function approveRemoteRequest(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $attendance = $this->attendanceService->approveRemoteRequest($id, $request->user());
            return response()->json([
                'message' => 'Remote check-in approved.',
                'attendance' => $attendance,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function rejectRemoteRequest(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['reason' => 'required|string|max:500']);

        try {
            $attendance = $this->attendanceService->rejectRemoteRequest($id, $request->user(), $request->reason);
            return response()->json([
                'message' => 'Remote check-in rejected.',
                'attendance' => $attendance,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    // ── Remote Authorization Toggle ──────────────────────────────────

    /**
     * Toggle remote check-in authorization for an employee (HR/Admin only).
     */
    public function toggleRemoteAuthorization(Request $request, int $userId): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $user = $this->attendanceService->toggleRemoteAuthorization($userId);
            $status = $user->remote_checkin_authorized ? 'authorized' : 'revoked';
            return response()->json([
                'message' => "Remote check-in {$status} for {$user->name}.",
                'user' => $user,
                'remote_checkin_authorized' => $user->remote_checkin_authorized,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    // ── Queries ───────────────────────────────────────────────────────

    /**
     * Get attendance history for the authenticated employee.
     * Returns only the current week's records.
     */
    public function myHistory(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        return response()->json($this->attendanceService->getMyWeekHistory($employee->id));
    }

    /**
     * Get attendance history for any employee (HR/ Admin)
     */
    public function history(Request $request, int $employeeId): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($this->attendanceService->getHistoryByEmployee($employeeId));
    }

    /**
     * Generate a kiosk QR code valid for a chosen period ('day', 'week', 'month'),
     * so it can be printed/displayed and scanned by employees throughout that period.
     *
     * GET /api/attendance/qr-code?period=day|week|month
     */
    public function generateQRCode(Request $request): mixed
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $period = $request->query('period', 'day');
        if (!in_array($period, ['day', 'week', 'month'], true)) {
            $period = 'day';
        }

        $qr = $this->attendanceService->generateQrToken($period);

        $qrCode = QrCode::format('svg')
            ->size(400)
            ->margin(2)
            ->style('dot')       // Keeps the modern rounded dots
            ->eye('circle')      // Keeps the circular corner squares
            ->color(0, 102, 204) // Professional Blue
            ->backgroundColor(240, 255, 240) // Very light green background
            ->generate($qr['token']);

        return response($qrCode, 200)
            ->header('Content-Type', 'image/svg+xml')
            ->header('X-Qr-Period', $qr['period'])
            ->header('X-Qr-Expires-At', $qr['expires_at']->toIso8601String());
    }

    /**
     * Export attendance records to CSV (HR/ Admin)
     */
    public function exportCsv(Request $request)
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $this->attendanceService->exportCsv();
    }

    /**
     * Update an attendance record (Admin/HR)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'check_in_time' => 'nullable|date_format:H:i:s',
            'check_out_time' => 'nullable|date_format:H:i:s',
            'status' => 'nullable|string',
        ]);

        try {
            $attendance = $this->attendanceService->updateAttendance($id, array_filter($validated, function($val) {
                return $val !== null;
            }));
            
            return response()->json([
                'message' => 'Attendance updated successfully.',
                'attendance' => $attendance,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update attendance: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Delete an attendance record (Admin/HR)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $this->attendanceService->deleteAttendance($id);
            return response()->json(['message' => 'Attendance deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete attendance.'], 400);
        }
    }
}
