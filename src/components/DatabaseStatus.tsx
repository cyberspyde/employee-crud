import { useDatabaseStatus } from '../hooks/useDatabaseStatus';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DatabaseStatus() {
  const { status, message, refresh } = useDatabaseStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500/20 dark:bg-green-500/20',
          borderColor: 'border-green-300 dark:border-green-500/30',
          textColor: 'text-green-700 dark:text-green-300',
          pulseColor: 'bg-green-500',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-500/20 dark:bg-red-500/20',
          borderColor: 'border-red-300 dark:border-red-500/30',
          textColor: 'text-red-700 dark:text-red-300',
          pulseColor: 'bg-red-500',
        };
      case 'checking':
        return {
          icon: Loader2,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/20 dark:bg-blue-500/20',
          borderColor: 'border-blue-300 dark:border-blue-500/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          pulseColor: 'bg-blue-500',
        };
      case 'disconnected':
        return {
          icon: AlertCircle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-500/20 dark:bg-amber-500/20',
          borderColor: 'border-amber-300 dark:border-amber-500/30',
          textColor: 'text-amber-700 dark:text-amber-300',
          pulseColor: 'bg-amber-500',
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-500/20 dark:bg-gray-500/20',
          borderColor: 'border-gray-300 dark:border-gray-500/30',
          textColor: 'text-gray-700 dark:text-gray-300',
          pulseColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <button
      onClick={refresh}
      className={`group relative flex items-center space-x-2 rounded-full border px-3 py-1 text-xs transition-all duration-300 ${config.borderColor} ${config.bgColor} ${config.textColor} hover:scale-105 hover:shadow-md`}
      title={`${message} - Yangilash uchun bosing`}
      aria-label={message}
    >
      {/* Status Icon with Animation */}
      <span className={`relative inline-flex h-5 w-5 items-center justify-center`}>
        {status === 'connected' && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.pulseColor} opacity-75`}></span>
        )}
        <StatusIcon
          className={`h-4 w-4 transition-all duration-300 ${config.iconColor} ${
            status === 'checking' ? 'animate-spin' : ''
          }`}
        />
      </span>

      {/* Status Text */}
      <span className="hidden sm:inline font-medium transition-opacity duration-300 group-hover:opacity-80">
        {message}
      </span>

      {/* Hover Tooltip for Mobile */}
      <span className="pointer-events-none absolute -top-10 left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700 sm:hidden">
        {message}
      </span>
    </button>
  );
}
