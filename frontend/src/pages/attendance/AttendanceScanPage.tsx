import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import { Button } from '../../components/common/Button';
import { LogIn, LogOut, Loader2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const AttendanceScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid QR code. No token found in URL.');
    }
  }, [token]);

  const getCoordinates = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('This device does not support location services. Attendance requires your location.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(`Location permission is required. (${err.message})`)),
        { timeout: 30000, enableHighAccuracy: false, maximumAge: 10000 }
      );
    });
  };

  const handleAction = async (action: 'check-in' | 'check-out') => {
    if (!token) return;

    setLoading(true);
    setStatus('idle');
    try {
      const coords = await getCoordinates();
      if (action === 'check-in') {
        await attendanceService.checkIn({
          latitude: coords.latitude,
          longitude: coords.longitude,
          qr_code: token,
        });
        setMessage('Checked in successfully!');
      } else {
        await attendanceService.checkOut({
          latitude: coords.latitude,
          longitude: coords.longitude,
          qr_code: token,
        });
        setMessage('Checked out successfully!');
      }
      setStatus('success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/attendance');
      }, 3000);
      
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Attendance recording failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md p-8 bg-white border border-[#05AD98]/10 rounded-2xl shadow-sm text-center">
        
        <div className="w-16 h-16 bg-[#05AD98]/10 text-[#05AD98] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Office Check-in</h1>
        <p className="text-gray-500 mb-8">
          You scanned an office QR code. Please confirm your action to record your attendance.
        </p>

        {status === 'success' && (
          <div className="flex items-center gap-2 p-4 text-[#037667] bg-[#05AD98]/10 border border-[#05AD98]/20 rounded-xl mb-6">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm text-left">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-100 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm text-left">{message}</p>
          </div>
        )}

        {status !== 'success' && (
          <div className="space-y-4">
            <Button 
              className="w-full h-14 text-base bg-gray-900 hover:bg-gray-800 text-white" 
              onClick={() => handleAction('check-in')}
              disabled={loading || !token}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
              Clock In Now
            </Button>
            
            <Button 
              variant="outline"
              className="w-full h-14 text-base border-gray-200 hover:bg-gray-50"
              onClick={() => handleAction('check-out')}
              disabled={loading || !token}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5 mr-2" />}
              Clock Out
            </Button>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-400">
          Note: Your GPS location will be captured to verify you are at the office.
        </div>
      </div>
    </div>
  );
};
