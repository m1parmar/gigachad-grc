import { useState, useEffect, useCallback } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface SessionWarningProps {
  // Time in ms before expiry to show warning (default: 5 minutes)
  warningThreshold?: number;
  // Callback when user chooses to extend session
  onExtendSession?: () => void;
}

/**
 * SessionWarning - Warns users before their session expires
 * Shows a dismissible banner with option to extend session
 */
export default function SessionWarning({
  warningThreshold = 5 * 60 * 1000, // 5 minutes
  onExtendSession,
}: SessionWarningProps) {
  const { isAuthenticated, token } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Parse JWT to get expiration time
  const getTokenExpiry = useCallback((token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to ms
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || dismissed) {
      setShowWarning(false);
      return;
    }

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const checkExpiry = () => {
      const now = Date.now();
      const remaining = expiry - now;

      if (remaining <= 0) {
        // Session expired - auth context will handle redirect
        setShowWarning(false);
      } else if (remaining <= warningThreshold) {
        setShowWarning(true);
        setTimeRemaining(remaining);
      } else {
        setShowWarning(false);
        setTimeRemaining(null);
      }
    };

    // Check immediately and then every 10 seconds
    checkExpiry();
    const interval = setInterval(checkExpiry, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, warningThreshold, dismissed, getTokenExpiry]);

  const handleExtend = useCallback(() => {
    onExtendSession?.();
    setDismissed(true);
    setShowWarning(false);
  }, [onExtendSession]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowWarning(false);
  }, []);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  if (!showWarning || !timeRemaining) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fade-in">
      <div className="bg-yellow-600 text-white rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Session Expiring Soon</h4>
            <p className="text-sm text-yellow-100 mt-1">
              Your session will expire in {formatTime(timeRemaining)}. 
              Save your work to avoid losing any changes.
            </p>
            <div className="flex gap-2 mt-3">
              {onExtendSession && (
                <button
                  onClick={handleExtend}
                  className="px-3 py-1.5 bg-white text-yellow-700 rounded text-sm font-medium hover:bg-yellow-50 transition-colors"
                >
                  Extend Session
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-yellow-700 text-white rounded text-sm font-medium hover:bg-yellow-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-200 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

