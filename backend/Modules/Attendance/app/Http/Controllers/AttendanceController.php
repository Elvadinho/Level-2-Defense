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
    public function __construct(private readonly AttendanceService $attendanceService)
    {

    }

//  List all attendance records
    /**
     * List all attendance records (HR / Admin).
     */
    public function index(): JsonResponse
    {
        return response()->json($this->attendanceService->getAll());
    }

//    Check in employee identified from auth token
    public function checkIn(AttendanceRequest $request): JsonResponse
    {
        $employee = $request->user()->employee;

        if(!$employee){
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        try{
            $attendance = $this->attendanceService->checkIn(
                $employee,
                $request->latitude,
                $request->longitude,
            );

            return response()->json([
                'message' => 'Checked in successfully.',
                'attendance' => $attendance->load('employee.user'),
            ], 201);
        } catch (\RuntimeException $e){
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

        if(!$employee) {
            return response()->json(['message' => 'No employee profile linked to this account.'], 403);
        }

        return response()->json($this->attendanceService->getHistoryByEmployee($employee->id));
    }

    /**
     * Get attendance history for any employee (HR/ Admin)
     */
    public function history(int $employeeId): JsonResponse
    {
        return response()->json($this->attendanceService->getHistoryByEmployee($employeeId));
    }

    public function generateQRCode(): mixed
    {
        $url = env('APP_URL', 'http://localhost:3000') . '/attendance';

        $qrCode = QrCode::format('svg')
            ->size(400)
            ->margin(2)
            ->generate($url);

        return response($qrCode, 200)
            ->header('Content-Type', 'image/svg+xml');
    }

}



























