import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';
import Button from '../components/ui/Button';
import AddEventModal from '../components/events/AddEventModal';
import ImportScheduleModal from '../components/schedule/ImportScheduleModal';
import DownloadModal from '../components/schedule/DownloadModal';
import { 
  Plus, 
  Upload, 
  Download, 
  ThumbsUp, 
  Calendar as CalendarIcon,
  List,
  ArrowUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'game' | 'practice' | 'meeting' | 'social';
  start_time: string;
  end_time: string;
  location?: string;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  game_status?: string;
  created_at: string;
}

type ViewMode = 'upcoming' | 'list' | 'calendar';

const Schedule: React.FC = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    if (currentTeam) {
      fetchEvents();
    }
  }, [currentTeam]);

  const fetchEvents = async () => {
    if (!currentTeam) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', currentTeam.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAdded = () => {
    fetchEvents();
  };

  const handleImportComplete = () => {
    fetchEvents();
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/schedule/event/${eventId}`);
  };

  const getWinLossRecord = () => {
    return "0-0-0";
  };

  const getSeasonInfo = () => {
    if (!currentTeam) return "SEASON";
    return `${currentTeam.name.toUpperCase()} ${currentTeam.season || 'WINTER 39/2023'}`;
  };

  const getLeagueInfo = () => {
    if (!currentTeam) return "";
    return currentTeam.description || "NHL — div 1";
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start_time) > now).slice(0, 5);
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  // Format event display for calendar
  const formatEventForCalendar = (event: Event) => {
    if (event.event_type === 'game') {
      // Show score if available
      if (event.home_score !== undefined && event.away_score !== undefined) {
        const homeScore = event.home_score;
        const awayScore = event.away_score;
        const result = homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'T';
        return `${homeScore}-${awayScore} ${result}`;
      }
      // Show vs opponent if no score
      return event.away_team ? `vs ${event.away_team}` : 'Game';
    }
    return event.title;
  };

  const renderTabNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="bg-white rounded-full border border-gray-300 p-1 flex">
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'upcoming'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Up Next
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'calendar'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Calendar
        </button>
      </div>
    </div>
  );

  const renderTeamHeader = () => (
    <div className="bg-gray-100 rounded-lg p-6 mb-8">
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 bg-gray-600 rounded-full flex items-center justify-center">
          <div className="text-white font-bold text-lg">
            {currentTeam?.name?.charAt(0) || 'T'}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentTeam?.name || 'Team Name'}
          </h1>
          <p className="text-gray-600 text-sm">
            {getSeasonInfo()}
          </p>
          <p className="text-gray-500 text-sm">
            {getWinLossRecord()}
          </p>
          <p className="text-gray-500 text-sm">
            {getLeagueInfo()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderUpNextView = () => {
    const upcomingEvents = getUpcomingEvents();
    
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <CalendarIcon className="h-16 w-16 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              You have no upcoming events for the {currentTeam?.name?.toLowerCase() || 'team'} ({currentTeam?.season?.toLowerCase() || 'winter 39/2023'})
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowAddEventModal(true)}
          >
            Add Event
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50">
            Add Multiple Events
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={() => setShowImportModal(true)}
          >
            Import Schedule
          </Button>
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    const monthNames = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setMonth(month - 1);
      } else {
        newDate.setMonth(month + 1);
      }
      setCurrentDate(newDate);
    };

    const goToToday = () => {
      setCurrentDate(new Date());
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return (
                  <div key={index} className="h-32 bg-gray-50 border border-gray-200" />
                );
              }

              const cellDate = new Date(year, month, day);
              const dayEvents = getEventsForDate(cellDate);
              const isToday = cellDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  className={`h-32 p-2 border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event.id)}
                        className="bg-blue-500 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center"
                      >
                        <div className="flex items-center space-x-1">
                          {event.event_type === 'game' && (
                            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            </div>
                          )}
                          <span className="font-medium truncate">
                            {formatEventForCalendar(event)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowAddEventModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
            <Button variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50">
              Add Multiple Events
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setShowDownloadModal(true)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-600 text-white">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              HOME
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              AWAY
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              W/L/T
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              DATE
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              TIME
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
              LOCATION
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-32 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <ThumbsUp className="h-16 w-16 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to your new season!
                    </h3>
                    <p className="text-gray-600">
                      Select an option below.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr 
                key={event.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleEventClick(event.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.home_team || currentTeam?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.away_team || 'TBD'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.home_score !== undefined && event.away_score !== undefined ? (
                    event.home_score > event.away_score ? 'W' : 
                    event.home_score < event.away_score ? 'L' : 'T'
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(event.start_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(event.start_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.location || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-4 justify-between items-center mt-8">
      <div className="flex flex-wrap gap-4">
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowAddEventModal(true)}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
        <Button variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50">
          Add Multiple Events
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={() => setShowImportModal(true)}
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
          onClick={() => setShowDownloadModal(true)}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {renderTabNavigation()}
      
      {viewMode !== 'upcoming' && renderTeamHeader()}
      
      {viewMode === 'upcoming' && renderUpNextView()}
      {viewMode === 'list' && (
        <>
          {renderScheduleTable()}
          {renderActionButtons()}
        </>
      )}
      {viewMode === 'calendar' && renderCalendarView()}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onEventAdded={handleEventAdded}
      />

      {/* Import Schedule Modal */}
      <ImportScheduleModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default Schedule;