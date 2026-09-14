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

//  List all attendance records
    /**
     * List all attendance records (HR / Admin).
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role->value !== 'admin' && $request->user()->role->value !== 'hr_manager') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($this->attendanceService->getAll());
    }

    //    Check in employee identified from auth token
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
            );

            return response()->json([
                'message' => 'Checked in successfully.',
                'attendance' => $attendance->load('employee.user'),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

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
            );
            return response()->json([
                'message' => 'Checked out successfully.',
                'attendance' => $attendance->load('employee.user'),
            ], 200);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }
    /**
     * Get attendance history for the authenticated employee
     */
    public function myHistory(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        return response()->json($this->attendanceService->getHistoryByEmployee($employee->id));
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
}
