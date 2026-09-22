import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceRecord, QrKioskPeriod } from '../../types/attendance';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Clock,
  QrCode,
  MapPin,
  Loader2,
  RefreshCw,
  CheckCircle2,
  X,
  Search,
  Camera,
  ScanLine,
  AlertCircle,
  Download,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [remoteRequests, setRemoteRequests] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<number | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // HR Panels
  const [isRemotePanelOpen, setIsRemotePanelOpen] = useState<boolean>(true);

  // QR Code Kiosk Modal (HR generates QR for display)
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [qrPeriod, setQrPeriod] = useState<QrKioskPeriod>('day');
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // QR Scanner Modal (Employee scans QR to check-in/out)
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerAction, setScannerAction] = useState<'check-in' | 'check-out'>('check-in');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scannerMessage, setScannerMessage] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>('qr-reader-container');

  // Remote Check-in Modal
  const [showRemoteModal, setShowRemoteModal] = useState<boolean>(false);
  const [remoteReason, setRemoteReason] = useState<string>('');
  const [remoteLoading, setRemoteLoading] = useState<boolean>(false);

  // Reject Remote Request Modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Edit Attendance Modal (Admin/HR)
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  // Delete Attendance Modal (Admin/HR)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Today's status determination (using local timezone to prevent UTC reset bugs)
  const _today = new Date();
  const todayStr = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, '0')}-${String(_today.getDate()).padStart(2, '0')}`;
  
  const todayRecord = records.find(
    (r) => {
      // Safely check if r.date exists before calling startsWith
      const hasDateStr = r.date && typeof r.date === 'string' && r.date.startsWith(todayStr);
      const hasCreatedAtStr = r.created_at && typeof r.created_at === 'string' && r.created_at.startsWith(todayStr);
      // Ensure the record strictly belongs to the currently logged in user
      const isMyRecord = Boolean(
        (user?.employee?.id && r.employee_id === user.employee.id) || 
        (!user?.employee?.id && user?.id && r.employee?.user?.id === user.id)
      );
      return (hasDateStr || hasCreatedAtStr) && isMyRecord;
    }
  );

  const isCheckedIn = Boolean(
    todayRecord && (todayRecord.check_in_time || todayRecord.check_in) && !(todayRecord.check_out_time || todayRecord.check_out)
  );
  const isCompletedToday = Boolean(
    todayRecord && (todayRecord.check_in_time || todayRecord.check_in) && (todayRecord.check_out_time || todayRecord.check_out)
  );
  const isPendingRemote = Boolean(
    todayRecord && todayRecord.is_remote && todayRecord.remote_status === 'pending'
  );

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAdminOrHR) {
        const [data, requestsData] = await Promise.all([
          attendanceService.getAllAttendance(employeeFilter),
          attendanceService.getRemoteRequests()
        ]);
        setRecords(Array.isArray(data) ? data : []);
        setRemoteRequests(Array.isArray(requestsData) ? requestsData : []);
      } else {
        const data = await attendanceService.getMyHistory();
        setRecords(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Could not load attendance records.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrHR, employeeFilter]);

  // Build unique employee list for the filter dropdown (admin only)
  const uniqueEmployees = useMemo(() => {
    const map = new Map<number, string>();
    records.forEach(r => {
      if (r.employee_id && r.employee?.user?.name) {
        map.set(r.employee_id, r.employee.user.name);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Geolocation helper ──
  const getCoordinates = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('This device does not support location services. Attendance requires your location.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(`Location permission is required to record attendance. Please allow location access and try again. (${err.message})`)),
        { timeout: 30000, enableHighAccuracy: false, maximumAge: 10000 }
      );
    });
  };

  // ── Check-in/out actions (called after successful QR scan) ──
  const executeCheckIn = async (qrCode: string) => {
    setIsActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const coords = await getCoordinates();
      await attendanceService.checkIn({
        latitude: coords.latitude,
        longitude: coords.longitude,
        qr_code: qrCode,
      });
      setSuccessMessage('Checked in successfully!');
      await fetchAttendance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeCheckOut = async (qrCode: string) => {
    setIsActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const coords = await getCoordinates();
      await attendanceService.checkOut({
        latitude: coords.latitude,
        longitude: coords.longitude,
        qr_code: qrCode,
      });
      setSuccessMessage('Checked out successfully!');
      await fetchAttendance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-out failed. Please try again.';
      setError(message);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoteCheckIn = async () => {
    if (!remoteReason.trim()) {
      setError('Please provide a reason for remote check-in.');
      return;
    }

    setRemoteLoading(true);
    setError(null);
    try {
      let coords: { latitude?: number; longitude?: number } = {};
      try {
        coords = await getCoordinates();
      } catch (err) {
        console.warn('Could not get coordinates for remote check-in', err);
      }

      const res = await attendanceService.requestRemoteCheckIn({
        reason: remoteReason,
        ...coords
      });
      
      setSuccessMessage(res.message || 'Remote check-in request submitted.');
      setShowRemoteModal(false);
      setRemoteReason('');
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remote check-in failed.');
    } finally {
      setRemoteLoading(false);
    }
  };

  // ── HR Actions ──
  const handleApproveRemote = async (id: number) => {
    setIsActionLoading(true);
    try {
      await attendanceService.approveRemoteRequest(id);
      setSuccessMessage('Remote check-in approved.');
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectRemote = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    
    setIsActionLoading(true);
    try {
      await attendanceService.rejectRemoteRequest(rejectId, rejectReason);
      setSuccessMessage('Remote check-in rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectId(null);
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateAttendance = async () => {
    if (!editRecord) return;
    setIsActionLoading(true);
    try {
      await attendanceService.updateAttendance(editRecord.id, {
        check_in_time: editRecord.check_in_time || null,
        check_out_time: editRecord.check_out_time || null,
        status: editRecord.status,
      });
      setSuccessMessage('Attendance updated successfully.');
      setShowEditModal(false);
      setEditRecord(null);
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!deleteId) return;
    setIsActionLoading(true);
    try {
      await attendanceService.deleteAttendance(deleteId);
      setSuccessMessage('Attendance deleted successfully.');
      setShowDeleteModal(false);
      setDeleteId(null);
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleRemoteAuth = async (userId: number) => {
    setIsActionLoading(true);
    try {
      const res = await attendanceService.toggleRemoteAuth(userId);
      setSuccessMessage(res.message);
      await fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle remote authorization.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Attendance Report', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = records.map(rec => {
        const empName = rec.employee?.user?.name || `Staff #${rec.employee_id}`;
        
        let dateStr = '—';
        if (rec.date && typeof rec.date === 'string') {
          dateStr = rec.date.substring(0, 10);
        } else if (rec.created_at && typeof rec.created_at === 'string') {
          dateStr = rec.created_at.substring(0, 10);
        }
        
        const inTime = rec.check_in_time || rec.check_in || '—';
        const outTime = rec.check_out_time || rec.check_out || '—';
        
        let hours = '—';
        if (rec.check_in_time && rec.check_out_time) {
          try {
            const start = new Date(`2000-01-01T${rec.check_in_time}`);
            const end = new Date(`2000-01-01T${rec.check_out_time}`);
            const diffMs = end.getTime() - start.getTime();
            if (!isNaN(diffMs) && diffMs >= 0) {
              hours = `${Math.floor(diffMs / (1000 * 60 * 60))}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m`;
            }
          } catch {}
        }
        
        const location = rec.is_remote ? 'Remote' : (rec.location || 'Office HQ');
        const status = (rec.is_remote && rec.remote_status === 'pending') ? 'Pending HR' : (rec.status || 'present');

        let distance = '—';
        if (rec.check_in_distance != null) {
          distance = rec.check_in_distance < 1000 ? `${Math.round(rec.check_in_distance)}m` : `${(rec.check_in_distance / 1000).toFixed(1)}km`;
        }

        const fraud = rec.fraud_flag ? 'FLAGGED' : '';

        return [empName, dateStr, inTime, outTime, hours, distance, location, status, fraud];
      });

      autoTable(doc, {
        startY: 36,
        head: [['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Distance', 'Location', 'Status', 'Security']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [5, 173, 152] },
        styles: { fontSize: 8 },
      });

      doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccessMessage('Attendance exported as PDF successfully.');
    } catch (err) {
      console.error(err);
      setError('Failed to export PDF.');
    }
  };

  // ── QR Scanner Logic ──
  const openScanner = (action: 'check-in' | 'check-out') => {
    setScannerAction(action);
    setScannerStatus('idle');
    setScannerMessage('');
    setShowScannerModal(true);
  };

  const startScanning = () => {
    setScannerStatus('scanning');
    setScannerMessage('Point your camera at the QR code displayed at the office entrance...');
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (scannerStatus !== 'scanning') {
      return;
    }

    let cancelled = false;
    const html5QrCode = new Html5Qrcode(scannerContainerRef.current);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;

          try {
            html5QrCode.stop().catch(() => {});
          } catch (e) {
            // ignore
          }

          scannerRef.current = null;
          setScannerStatus('success');
          setScannerMessage('QR code verified! Processing your attendance...');

          (async () => {
            try {
              if (scannerAction === 'check-in') {
                await executeCheckIn(decodedText);
              } else {
                await executeCheckOut(decodedText);
              }
              
              // Keep the success state visible for a moment before closing
              setTimeout(() => {
                setShowScannerModal(false);
                setScannerStatus('idle');
              }, 1500);
            } catch {
              setScannerStatus('error');
              setScannerMessage('Could not record your attendance with this QR code. Please try again.');
            }
          })();
        },
        () => {
          // Scan frame with no QR found — keep scanning silently
        }
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        scannerRef.current = null;
        setScannerStatus('error');
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('NotAllowed') || message.includes('Permission')) {
          setScannerMessage('Camera permission was denied. Please allow camera access in your browser settings and try again.');
        } else if (!window.isSecureContext) {
          setScannerMessage('Camera access requires a secure HTTPS connection or localhost. Please ensure you are not testing over plain HTTP on your network.');
        } else {
          setScannerMessage(`Could not access camera: ${message}`);
        }
      });

    return () => {
      cancelled = true;
      try {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(() => {}).finally(() => {
            try { html5QrCode.clear(); } catch {}
          });
        } else {
          try { html5QrCode.clear(); } catch {}
        }
      } catch (e) {
        // Ignore synchronous throw
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerStatus]);

  const closeScannerModal = async () => {
    // Hide the modal immediately for better UX
    setShowScannerModal(false);
    setScannerStatus('idle');
    setScannerMessage('');
    // Then stop the camera in the background
    await stopScanning();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning().catch(() => {});
    };
  }, []);

  // ── HR QR Kiosk ──
  const generateKioskQr = async (period: QrKioskPeriod) => {
    setShowQrModal(true);
    setQrLoading(true);
    setQrError(null);
    setQrSvg(null);
    try {
      const res = await attendanceService.generateQrCode(period);
      setQrSvg(res.svg);
      setQrPeriod(res.period);
      setQrExpiresAt(res.expiresAt);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'Failed to generate QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleOpenQrModal = () => generateKioskQr(qrPeriod);

  const handleDownloadQr = () => {
    if (!qrSvg) return;
    const cleanSvg = qrSvg.replace(/^\uFEFF?\s*/, '');
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-qr-${qrPeriod}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const qrPeriodOptions: { value: QrKioskPeriod; label: string }[] = [
    { value: 'day', label: '1 Day' },
    { value: 'week', label: '1 Week' },
    { value: 'month', label: '1 Month' },
  ];

  // ── Data Processing & Pagination ──
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const empName = r.employee?.user?.name || '';
      const location = r.location || (r.is_remote ? 'Remote' : 'Office');
      
      let dateStr = '';
      if (r.date && typeof r.date === 'string') {
        dateStr = r.date;
      } else if (r.created_at && typeof r.created_at === 'string') {
        dateStr = r.created_at.substring(0, 10);
      }
      
      return (
        empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dateStr.includes(searchQuery)
      );
    });
  }, [records, searchQuery]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  
  // Ensure current page is valid when filtering changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    // If it's already YYYY-MM-DD, just return it
    if (dateString.length === 10 && dateString.includes('-')) return dateString;
    // Otherwise try to extract YYYY-MM-DD
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return String(dateString).substring(0, 10);
    }
  };

  // Calculate duration helper
  const calculateDuration = (inTime?: string | null, outTime?: string | null) => {
    if (!inTime || !outTime) return '—';
    try {
      const start = new Date(`2000-01-01T${inTime}`);
      const end = new Date(`2000-01-01T${outTime}`);
      const diffMs = end.getTime() - start.getTime();
      if (isNaN(diffMs) || diffMs < 0) return '—';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Human Resources</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">{isAdminOrHR ? 'Attendance & Check-in' : 'My Attendance This Week'}</span>
            <span className="text-xs text-slate-400 font-medium">({filteredRecords.length} records)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrHR && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenQrModal}
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-[#05AD98]" />}
                >
                  QR Kiosk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdf}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  Export PDF
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAttendance}
              leftIcon={<RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Search filter + Employee dropdown (Admin/HR only) */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee, location, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>
          {isAdminOrHR && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={employeeFilter || ''}
                onChange={(e) => {
                  setEmployeeFilter(e.target.value ? Number(e.target.value) : undefined);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-200 rounded-lg py-1.5 px-2 bg-white focus:outline-none focus:border-[#05AD98] min-w-[140px]"
              >
                <option value="">All Employees</option>
                {uniqueEmployees.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Admin/HR Pending Remote Requests Panel */}
      {isAdminOrHR && remoteRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden shadow-xs">
          <button 
            className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
            onClick={() => setIsRemotePanelOpen(!isRemotePanelOpen)}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                {remoteRequests.length}
              </div>
              <span className="font-semibold text-sm text-amber-900">Pending Remote Check-in Requests</span>
            </div>
            {isRemotePanelOpen ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
          </button>
          
          {isRemotePanelOpen && (
            <div className="border-t border-amber-200 p-4 space-y-3 bg-white">
              {remoteRequests.map(req => (
                <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 border border-slate-100 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                      {req.employee?.user?.name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{req.employee?.user?.name || `Staff #${req.employee_id}`}</div>
                      <div className="text-xs text-slate-500">Date: {formatDate(req.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-white p-2 rounded border border-slate-200 text-xs italic text-slate-600">
                    "{req.remote_reason}"
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleApproveRemote(req.id)}
                      isLoading={isActionLoading}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => {
                        setRejectId(req.id);
                        setShowRejectModal(true);
                      }}
                      disabled={isActionLoading}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Punch Widget & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action Punch Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Daily Work Shift
              </p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#05AD98]/10 text-[#05AD98] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-600">Status Today:</span>
            {isPendingRemote ? (
              <span className="font-semibold text-amber-600 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending Approval
              </span>
            ) : isCompletedToday ? (
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Shift Completed
              </span>
            ) : isCheckedIn ? (
              <span className="font-semibold text-[#05AD98] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> Clocked In
              </span>
            ) : (
              <span className="font-semibold text-slate-500">Not Clocked In</span>
            )}
          </div>

          <div className="space-y-2">
            {!isCheckedIn && !isCompletedToday && !isPendingRemote && (
              <>
                <Button
                  variant="primary"
                  onClick={() => openScanner('check-in')}
                  isLoading={isActionLoading}
                  leftIcon={<Camera className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Scan QR to Clock In
                </Button>
                <button
                  onClick={() => setShowRemoteModal(true)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wifi className="w-3.5 h-3.5" /> Request Remote Check-in
                </button>
              </>
            )}

            {isCheckedIn && !isCompletedToday && (
              <Button
                variant="danger"
                onClick={() => openScanner('check-out')}
                isLoading={isActionLoading}
                leftIcon={<Camera className="w-4 h-4" />}
                className="w-full justify-center"
              >
                Scan QR to Clock Out
              </Button>
            )}

            {isCompletedToday && (
              <Button variant="secondary" disabled className="w-full justify-center">
                Completed for Today
              </Button>
            )}
            
            {isPendingRemote && (
              <div className="text-xs text-center text-slate-500 py-1 border border-dashed border-slate-200 rounded p-2">
                Your remote check-in request is pending HR approval.
              </div>
            )}
          </div>
        </div>

        {/* GPS Geofence Security Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Location Security
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#05AD98]" /> Geofence & GPS
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Validates your presence at the office. Remote check-ins require authorization or HR approval.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>GPS positioning active</span>
          </div>
        </div>

        {/* Shift Attendance Stats */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isAdminOrHR ? 'All Records' : 'This Week'}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {records.length} <span className="text-xs font-normal text-slate-400">{isAdminOrHR ? 'total entries' : 'this week'}</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <p className="text-[10px] uppercase font-bold text-emerald-600">Present</p>
              <p className="text-sm font-bold">{records.filter((r) => r.status === 'present').length}</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <p className="text-[10px] uppercase font-bold text-amber-600">Late</p>
              <p className="text-sm font-bold">{records.filter((r) => r.status === 'late').length}</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500">Leave</p>
              <p className="text-sm font-bold">{records.filter((r) => r.status === 'on_leave').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {isLoading && records.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
            <p className="text-xs font-medium">Loading attendance records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Clock In</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Distance</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                    {isAdminOrHR && (
                      <>
                        <th className="px-4 py-3">Security</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((rec) => {
                      const empName = rec.employee?.user?.name || `Staff #${rec.employee_id}`;
                      const isPending = rec.is_remote && rec.remote_status === 'pending';
                      const isFraud = rec.fraud_flag;
                      
                      return (
                        <tr key={rec.id} className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/30' : ''} ${isFraud ? 'bg-rose-50/40' : ''}`}>
                          <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isFraud ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-[#05AD98]'}`}>
                              {empName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate">{empName}</div>
                              {isAdminOrHR && rec.employee?.job_title && (
                                <div className="text-[10px] text-slate-400 font-normal truncate">{rec.employee.job_title}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {formatDate(rec.date || rec.created_at)}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                            {rec.check_in_time || rec.check_in || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                            {rec.check_out_time || rec.check_out || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                            {calculateDuration(rec.check_in_time, rec.check_out_time)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {rec.check_in_distance != null ? (
                              <span className="font-mono text-xs font-semibold text-slate-500">
                                {rec.check_in_distance < 1000 ? `${Math.round(rec.check_in_distance)}m` : `${(rec.check_in_distance / 1000).toFixed(1)}km`}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {rec.is_remote ? (
                              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                <Wifi className="w-3 h-3" />
                                Remote
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {rec.location || 'Office HQ'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isPending ? (
                              <Badge variant="warning" size="sm">Pending HR</Badge>
                            ) : rec.is_remote && rec.remote_status === 'rejected' ? (
                              <Badge variant="danger" size="sm">Rejected</Badge>
                            ) : (
                              <Badge
                                variant={
                                  rec.status === 'present'
                                    ? 'success'
                                    : rec.status === 'late'
                                    ? 'warning'
                                    : rec.status === 'absent'
                                    ? 'danger'
                                    : 'silver'
                                }
                                size="sm"
                              >
                                {rec.status || 'present'}
                              </Badge>
                            )}
                          </td>
                          {isAdminOrHR && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col gap-2">
                                <div>
                                  {isFraud ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold" title={rec.fraud_reason || 'Flagged for review'}>
                                      <ShieldAlert className="w-3 h-3" /> FRAUD
                                    </span>
                                  ) : (
                                    <span className="text-emerald-500 text-[10px] font-medium">✓ Clean</span>
                                  )}
                                </div>
                                {rec.employee?.user && (
                                  <button
                                    onClick={() => handleToggleRemoteAuth(rec.employee!.user!.id)}
                                    disabled={isActionLoading}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                      rec.employee.user.remote_checkin_authorized 
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' 
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {rec.employee.user.remote_checkin_authorized ? (
                                      <><Wifi className="w-3 h-3" /> Remote Auth: ON</>
                                    ) : (
                                      <><WifiOff className="w-3 h-3" /> Remote Auth: OFF</>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                          {isAdminOrHR && (
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setEditRecord(rec); setShowEditModal(true); }}
                                  className="text-xs font-semibold px-2 py-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded transition-colors"
                                  title="Edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => { setDeleteId(rec.id); setShowDeleteModal(true); }}
                                  className="text-xs font-semibold px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-colors"
                                  title="Delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isAdminOrHR ? 10 : 8} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-200 rounded p-1 bg-white focus:outline-none focus:border-[#05AD98]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════ QR CODE KIOSK MODAL (HR generates for display) ═══════════ */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Attendance QR Kiosk</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Display this QR code at the office entrance. Employees will scan it with their device camera to clock in and out.
            </p>

            <label className="block text-left text-xs font-semibold text-slate-700">
              QR validity period
              <select
                value={qrPeriod}
                onChange={(event) => generateKioskQr(event.target.value as QrKioskPeriod)}
                disabled={qrLoading}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#05AD98] focus:outline-none"
              >
                {qrPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center min-h-[220px]">
              {qrLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#05AD98]" />
              ) : qrError ? (
                <p className="text-xs text-rose-600 font-medium">{qrError}</p>
              ) : qrSvg ? (
                <div
                  className="w-48 h-48 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <p className="text-xs text-slate-400">QR Code Unavailable</p>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-[#05AD98]/10 border border-[#05AD98]/20 text-xs text-[#037667] font-medium">
              Valid for {qrPeriod === 'day' ? '1 day' : qrPeriod === 'week' ? '1 week' : '1 month'}
              {qrExpiresAt && ` — expires ${new Date(qrExpiresAt).toLocaleString()}.`}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenQrModal}
                isLoading={qrLoading}
                leftIcon={<RefreshCw className="w-3 h-3" />}
                className="flex-1 justify-center"
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                disabled={!qrSvg || qrLoading}
                leftIcon={<Download className="w-3 h-3" />}
                className="flex-1 justify-center"
              >
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowQrModal(false)}
                className="flex-1 justify-center"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ QR SCANNER MODAL (Employee scans to check-in/out) ═══════════ */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#05AD98]/10 flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-[#05AD98]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {scannerAction === 'check-in' ? 'Clock In Scanner' : 'Clock Out Scanner'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Point your camera at the office QR code</p>
                </div>
              </div>
              <button
                onClick={closeScannerModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Body */}
            <div className="p-5 space-y-4">
              {/* Camera viewfinder */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 min-h-[280px] flex items-center justify-center">
                {scannerStatus === 'idle' && (
                  <div className="text-center text-white/60 space-y-4 p-6">
                    <Camera className="w-12 h-12 mx-auto opacity-40" />
                    <p className="text-sm font-medium">Press the button below to activate your camera</p>
                  </div>
                )}

                {scannerStatus === 'scanning' && (
                  <>
                    <div id={scannerContainerRef.current} className="w-full h-full min-h-[280px]" />
                    {/* Scanning overlay corners */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-56 h-56 relative">
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#05AD98] rounded-tl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#05AD98] rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#05AD98] rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#05AD98] rounded-br" />
                        {/* Scanning line animation */}
                        <div className="absolute left-2 right-2 h-0.5 bg-[#05AD98]/60 animate-bounce" style={{ top: '50%' }} />
                      </div>
                    </div>
                  </>
                )}

                {scannerStatus === 'success' && (
                  <div className="text-center text-white space-y-3 p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold">QR Code Verified!</p>
                  </div>
                )}

                {scannerStatus === 'error' && (
                  <div className="text-center text-white space-y-3 p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-rose-400" />
                    </div>
                    <p className="text-sm font-semibold">Scan Failed</p>
                  </div>
                )}
              </div>

              {/* Status message */}
              {scannerMessage && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                  scannerStatus === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : scannerStatus === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : 'bg-[#05AD98]/10 border border-[#05AD98]/20 text-[#037667]'
                }`}>
                  {scannerStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  {scannerStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {scannerStatus === 'scanning' && <ScanLine className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />}
                  <span>{scannerMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {scannerStatus === 'idle' && (
                  <Button
                    variant="primary"
                    onClick={startScanning}
                    leftIcon={<Camera className="w-4 h-4" />}
                    className="w-full justify-center"
                  >
                    Activate Camera
                  </Button>
                )}
                {scannerStatus === 'scanning' && (
                  <Button
                    variant="secondary"
                    onClick={closeScannerModal}
                    className="w-full justify-center"
                  >
                    Cancel Scan
                  </Button>
                )}
                {scannerStatus === 'error' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setScannerStatus('idle');
                        setScannerMessage('');
                      }}
                      leftIcon={<Camera className="w-4 h-4" />}
                      className="flex-1 justify-center"
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={closeScannerModal}
                      className="flex-1 justify-center"
                    >
                      Close
                    </Button>
                  </>
                )}
                {scannerStatus === 'success' && (
                  <Button
                    variant="secondary"
                    onClick={closeScannerModal}
                    className="w-full justify-center"
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ REMOTE CHECK-IN MODAL ═══════════ */}
      {showRemoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-600" />
                Remote Check-in
              </h3>
              <button
                onClick={() => setShowRemoteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please provide a reason for checking in remotely. If you are not authorized, your request will be sent to HR for approval.
            </p>

            <textarea
              value={remoteReason}
              onChange={(e) => setRemoteReason(e.target.value)}
              placeholder="e.g. Working from client site..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
            />

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleRemoteCheckIn}
                isLoading={remoteLoading}
                className="flex-1 justify-center"
              >
                Submit Request
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRemoteModal(false)}
                disabled={remoteLoading}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ REJECT MODAL (HR) ═══════════ */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600" />
                Reject Check-in
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please provide a reason for rejecting this remote check-in request.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please use the office QR code..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none resize-none"
            />

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="danger"
                onClick={handleRejectRemote}
                isLoading={isActionLoading}
                className="flex-1 justify-center"
              >
                Reject Request
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={isActionLoading}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Edit Attendance</h3>
            <p className="text-sm text-slate-500 mb-6">
              Update attendance times for {editRecord.employee?.user?.name || `Employee #${editRecord.employee_id}`}. Use HH:MM:SS format.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Time</label>
                <input
                  type="text"
                  value={editRecord.check_in_time || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, check_in_time: e.target.value })}
                  placeholder="09:00:00"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Time</label>
                <input
                  type="text"
                  value={editRecord.check_out_time || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, check_out_time: e.target.value })}
                  placeholder="17:00:00"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editRecord.status}
                  onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleUpdateAttendance}
                isLoading={isActionLoading}
                className="flex-1 justify-center"
              >
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowEditModal(false); setEditRecord(null); }}
                disabled={isActionLoading}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attendance Modal */}
      {showDeleteModal && deleteId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Attendance</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAttendance}
                isLoading={isActionLoading}
                className="flex-1 justify-center"
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
                disabled={isActionLoading}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

