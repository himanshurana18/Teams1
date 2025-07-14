import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';
import Button from '../components/ui/Button';
import QuickScoreModal from '../components/events/QuickScoreModal';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserX
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

interface Attendance {
  id: string;
  user_id: string;
  status: 'yes' | 'no' | 'maybe' | 'pending';
  responded_at?: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface AttendanceStats {
  attended: Attendance[];
  didNotAttend: Attendance[];
  waitListed: Attendance[];
  didNotRespond: Attendance[];
}

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { currentTeam, teamMembers } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStats>({
    attended: [],
    didNotAttend: [],
    waitListed: [],
    didNotRespond: []
  });
  const [loading, setLoading] = useState(true);
  const [userAttendance, setUserAttendance] = useState<string>('pending');
  const [showQuickScoreModal, setShowQuickScoreModal] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchAttendance();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchAttendance = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      // Process attendance data
      const attendanceMap: AttendanceStats = {
        attended: [],
        didNotAttend: [],
        waitListed: [],
        didNotRespond: []
      };

      const attendanceData = data || [];
      
      // Get all team members who should respond
      const allMembers = teamMembers.map(member => member.user_id);
      const respondedMembers = attendanceData.map(a => a.user_id);
      const notRespondedMembers = allMembers.filter(id => !respondedMembers.includes(id));

      // Categorize responses
      attendanceData.forEach((item: any) => {
        const attendanceItem = {
          ...item,
          user: item.profiles
        };

        switch (item.status) {
          case 'yes':
            attendanceMap.attended.push(attendanceItem);
            break;
          case 'no':
            attendanceMap.didNotAttend.push(attendanceItem);
            break;
          case 'maybe':
            attendanceMap.waitListed.push(attendanceItem);
            break;
          default:
            attendanceMap.didNotRespond.push(attendanceItem);
        }

        // Set current user's attendance status
        if (item.user_id === user?.id) {
          setUserAttendance(item.status);
        }
      });

      // Add members who haven't responded
      notRespondedMembers.forEach(memberId => {
        const member = teamMembers.find(m => m.user_id === memberId);
        if (member) {
          attendanceMap.didNotRespond.push({
            id: '',
            user_id: memberId,
            status: 'pending',
            user: {
              id: memberId,
              full_name: member.user.full_name || member.user.email,
              email: member.user.email
            }
          } as Attendance);
        }
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = async (status: 'yes' | 'no' | 'maybe') => {
    if (!eventId || !user) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          status: status,
          responded_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setUserAttendance(status);
      fetchAttendance();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const handleScoreUpdated = () => {
    fetchEventDetails(); // Refresh event data to get updated scores
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'bg-blue-100 text-blue-800';
      case 'practice':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDateTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const startTimeStr = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTimeStr = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return `${dayName.toUpperCase()}, ${monthDay.toUpperCase()} ${startTimeStr} - ${endTimeStr}`;
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full border border-gray-300 p-1 flex">
          <button
            onClick={() => navigate('/schedule')}
            className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Up Next
          </button>
          <button
            onClick={() => navigate('/schedule')}
            className="px-6 py-2 rounded-full text-sm font-medium bg-blue-500 text-white"
          >
            List
          </button>
          <button
            onClick={() => navigate('/schedule')}
            className="px-6 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Game Score Section (for games) */}
      {event.event_type === 'game' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex items-center space-x-6">
              <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="text-white font-bold text-xl">
                  {(event.home_team || currentTeam?.name || 'H').charAt(0)}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-blue-600 text-xl mb-1">
                  {event.home_team || currentTeam?.name || 'himax'}
                </h3>
                <p className="text-sm text-gray-500 font-medium">HOME</p>
              </div>
            </div>

            {/* Score and Game Info */}
            <div className="text-center">
              <div className="flex items-center space-x-12 mb-4">
                <div className="text-6xl font-bold text-gray-900">
                  {event.home_score ?? 0}
                </div>
                <div className="text-6xl font-bold text-gray-900">
                  {event.away_score ?? 0}
                </div>
              </div>
              
              {/* Date and Time */}
              <div className="text-right mb-4">
                <div className="text-lg font-bold text-gray-900">
                  {formatEventDateTime(event.start_time, event.end_time).split(' ')[0]} {formatEventDateTime(event.start_time, event.end_time).split(' ')[1]} {formatEventDateTime(event.start_time, event.end_time).split(' ')[2]}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatEventDateTime(event.start_time, event.end_time).split(' ').slice(3).join(' ')}
                </div>
              </div>

              {/* Game Status and Quick Score */}
              <div className="space-y-3">
                <div>
                  <span className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold">
                    {event.game_status || 'FINAL'}
                  </span>
                </div>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 text-sm font-medium"
                  onClick={() => setShowQuickScoreModal(true)}
                >
                  QUICK SCORE
                </Button>
              </div>
            </div>

            {/* Away Team */}
            <div className="flex items-center space-x-6">
              <div>
                <h3 className="font-bold text-gray-600 text-xl mb-1 text-right">
                  {event.away_team || 'To Be Determined'}
                </h3>
                <p className="text-sm text-gray-500 font-medium text-right">AWAY</p>
              </div>
              <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="text-white font-bold text-xl">
                  {(event.away_team || 'T').charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Header (for non-games) */}
      {event.event_type !== 'game' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/schedule')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {formatEventDateTime(event.start_time, event.end_time)}
                </p>
                {event.location && (
                  <div className="flex items-center mt-1 text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
        <p className="text-gray-600 mb-4">
          {event.description || 'Your opponent has not yet been assigned.'}
        </p>
        <div className="flex space-x-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Edit Lines
          </button>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Assign Rooms
          </button>
        </div>
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Attendance</h2>
        
        {/* Attendance Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                ATTENDED ({attendance.attended.length})
              </span>
            </div>
            <div className="space-y-1">
              {attendance.attended.map((item) => (
                <div key={item.id} className="text-sm text-gray-600">
                  {item.user.full_name || item.user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                DID NOT ATTEND ({attendance.didNotAttend.length})
              </span>
            </div>
            <div className="space-y-1">
              {attendance.didNotAttend.map((item) => (
                <div key={item.id} className="text-sm text-gray-600">
                  {item.user.full_name || item.user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="h-5 w-5 text-yellow-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                WAIT LISTED ({attendance.waitListed.length})
              </span>
            </div>
            <div className="space-y-1">
              {attendance.waitListed.map((item) => (
                <div key={item.id} className="text-sm text-gray-600">
                  {item.user.full_name || item.user.email}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <UserX className="h-5 w-5 text-gray-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">
                DID NOT RESPOND ({attendance.didNotRespond.length})
              </span>
            </div>
            <div className="space-y-1">
              {attendance.didNotRespond.map((item) => (
                <div key={item.user_id} className="text-sm text-gray-600">
                  {item.user.full_name || item.user.email}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roster Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ROSTER</h3>
            <div className="text-right">
              <div className="text-blue-600 font-medium">himanshu</div>
              <div className="text-xs text-gray-500">NOT YET NOTIFIED</div>
            </div>
          </div>
        </div>

        {/* User Attendance Actions */}
        {user && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your Response:</h3>
            <div className="flex space-x-3">
              <Button
                variant={userAttendance === 'yes' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => updateAttendance('yes')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Attending
              </Button>
              <Button
                variant={userAttendance === 'no' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => updateAttendance('no')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Not Attending
              </Button>
              <Button
                variant={userAttendance === 'maybe' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => updateAttendance('maybe')}
                className="flex items-center gap-2"
              >
                <ClockIcon className="h-4 w-4" />
                Maybe
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Score Modal */}
      {event && (
        <QuickScoreModal
          isOpen={showQuickScoreModal}
          onClose={() => setShowQuickScoreModal(false)}
          event={event}
          onScoreUpdated={handleScoreUpdated}
        />
      )}
    </div>
  );
};

export default EventDetail;