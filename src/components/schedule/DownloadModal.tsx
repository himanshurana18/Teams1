import React from 'react';
import { X, Download, Calendar } from 'lucide-react';
import { useTeam } from '../../contexts/TeamContext';
import Button from '../ui/Button';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const { currentTeam } = useTeam();

  const downloadSchedule = (type: 'current' | 'all') => {
    // Create ICS file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TeamManager//Schedule//EN
CALNAME:${currentTeam?.name || 'Team'} Schedule
BEGIN:VEVENT
DTSTART:20250629T190000Z
DTEND:20250629T203000Z
SUMMARY:Sample Game
DESCRIPTION:Sample game event
LOCATION:Sample Location
END:VEVENT
END:VCALENDAR`;

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTeam?.name || 'team'}_schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Download</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 space-y-6">
            {/* Current Team Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Team</h4>
              <p className="text-gray-900 mb-4">{currentTeam?.name || 'himax'}</p>
              
              <button
                onClick={() => downloadSchedule('current')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors border border-blue-600 rounded px-3 py-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Download Schedule (ICS)
              </button>
            </div>

            {/* Timezone Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                {currentTeam?.name || 'himax'} timezone is set to{' '}
                <span className="font-medium">Asia/Calcutta</span>{' '}
                <span className="text-blue-600 underline cursor-pointer">(Change)</span>
              </p>
            </div>

            {/* All Teams Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">All Teams</h4>
              <p className="text-gray-900 mb-4">{currentTeam?.name || 'himax'}</p>
              
              <button
                onClick={() => downloadSchedule('all')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors border border-blue-600 rounded px-3 py-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Download Schedule (ICS)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;