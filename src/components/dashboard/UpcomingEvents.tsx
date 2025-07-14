import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Event } from '../../types';
import { formatDate, formatTime } from '../../lib/utils';

interface UpcomingEventsProps {
  events: Event[];
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
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

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
      </div>
      <div className="flow-root">
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {events.slice(0, 5).map((event) => (
              <li key={event.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {formatDate(event.start_time)} at {formatTime(event.start_time)}
                      </div>
                      {event.location && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;