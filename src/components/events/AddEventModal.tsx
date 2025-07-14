import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText } from 'lucide-react';
import { useTeam } from '../../contexts/TeamContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'game', label: 'Game' },
  { value: 'practice', label: 'Practice' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'social', label: 'Social Event' },
];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '1day', label: '1 day before' },
  { value: '1week', label: '1 week before' },
];

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onEventAdded }) => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'game',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    description: '',
    home_team: '',
    away_team: '',
    repeat: 'none',
    reminder: 'none',
    all_day: false,
    private: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeam || !user) return;

    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Event title is required');
      }
      if (!formData.start_date) {
        throw new Error('Start date is required');
      }
      if (!formData.all_day && !formData.start_time) {
        throw new Error('Start time is required');
      }

      // Create start and end datetime
      const startDateTime = formData.all_day 
        ? new Date(formData.start_date + 'T00:00:00')
        : new Date(formData.start_date + 'T' + formData.start_time);

      let endDateTime;
      if (formData.all_day) {
        endDateTime = new Date(formData.end_date || formData.start_date + 'T23:59:59');
      } else {
        const endDate = formData.end_date || formData.start_date;
        const endTime = formData.end_time || formData.start_time;
        endDateTime = new Date(endDate + 'T' + endTime);
      }

      const eventData = {
        team_id: currentTeam.id,
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: formData.location || null,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      onEventAdded();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      event_type: 'game',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location: '',
      description: '',
      home_team: '',
      away_team: '',
      repeat: 'none',
      reminder: 'none',
      all_day: false,
      private: false,
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Add Event</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white px-6 py-4 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Event Title */}
            <Input
              label="Event Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />

            {/* Event Type */}
            <Select
              label="Event Type"
              value={formData.event_type}
              onChange={(value) => handleInputChange('event_type', value)}
              options={EVENT_TYPE_OPTIONS}
            />

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="all_day"
                  checked={formData.all_day}
                  onChange={(e) => handleInputChange('all_day', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="all_day" className="ml-2 block text-sm text-gray-900">
                  All day event
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
                {!formData.all_day && (
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    required={!formData.all_day}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  placeholder="Same as start date"
                />
                {!formData.all_day && (
                  <Input
                    label="End Time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    placeholder="Same as start time"
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter event location"
            />

            {/* Teams (for games) */}
            {formData.event_type === 'game' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Home Team"
                  value={formData.home_team}
                  onChange={(e) => handleInputChange('home_team', e.target.value)}
                  placeholder={currentTeam?.name || 'Home team'}
                />
                <Input
                  label="Away Team"
                  value={formData.away_team}
                  onChange={(e) => handleInputChange('away_team', e.target.value)}
                  placeholder="Away team"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event description (optional)"
              />
            </div>

            {/* Repeat */}
            <Select
              label="Repeat"
              value={formData.repeat}
              onChange={(value) => handleInputChange('repeat', value)}
              options={REPEAT_OPTIONS}
            />

            {/* Reminder */}
            <Select
              label="Reminder"
              value={formData.reminder}
              onChange={(value) => handleInputChange('reminder', value)}
              options={REMINDER_OPTIONS}
            />

            {/* Privacy */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="private"
                checked={formData.private}
                onChange={(e) => handleInputChange('private', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="private" className="ml-2 block text-sm text-gray-900">
                Private event (only visible to team managers)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Create Event
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;