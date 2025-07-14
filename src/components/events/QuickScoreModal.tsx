import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTeam } from '../../contexts/TeamContext';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

interface QuickScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated: () => void;
  event: {
    id: string;
    title: string;
    home_team?: string;
    away_team?: string;
    home_score?: number;
    away_score?: number;
    game_status?: string;
  };
}

const PERIOD_OPTIONS = [
  { value: 'final', label: 'Final' },
  { value: '1st', label: '1st Period' },
  { value: '2nd', label: '2nd Period' },
  { value: '3rd', label: '3rd Period' },
  { value: 'ot', label: 'OT' },
  { value: '2ot', label: '2OT' },
  { value: 'shootout', label: 'Shootout' },
  { value: 'forfeit', label: 'Forfeit' },
];

const QuickScoreModal: React.FC<QuickScoreModalProps> = ({ 
  isOpen, 
  onClose, 
  onScoreUpdated, 
  event 
}) => {
  const { currentTeam } = useTeam();
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [period, setPeriod] = useState('final');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form with existing scores when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setHomeScore(String(event.home_score ?? 0));
      setAwayScore(String(event.away_score ?? 0));
      setPeriod(event.game_status?.toLowerCase() || 'final');
    }
  }, [isOpen, event]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          home_score: parseInt(homeScore) || 0,
          away_score: parseInt(awayScore) || 0,
          game_status: getSelectedPeriodLabel().toUpperCase()
        })
        .eq('id', event.id);

      if (error) throw error;

      onScoreUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setHomeScore(String(event.home_score ?? 0));
    setAwayScore(String(event.away_score ?? 0));
    setPeriod(event.game_status?.toLowerCase() || 'final');
    onClose();
  };

  const handlePeriodSelect = (value: string) => {
    setPeriod(value);
    setShowPeriodDropdown(false);
  };

  const getSelectedPeriodLabel = () => {
    const option = PERIOD_OPTIONS.find(opt => opt.value === period);
    return option ? option.label : 'Final';
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
              <h3 className="text-lg font-medium text-gray-900">Quick Score</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 space-y-8">
            {/* Home Team */}
            <div className="text-center">
              <div className="text-blue-600 font-medium text-lg mb-2">
                {event.home_team || currentTeam?.name || 'HIMAX'}
              </div>
              <div className="text-gray-500 text-sm mb-3">HOME</div>
              <input
                type="number"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-20 h-16 text-3xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                min="0"
              />
            </div>

            {/* Away Team */}
            <div className="text-center">
              <div className="text-gray-600 font-medium text-lg mb-2">
                {event.away_team || 'AWAY'}
              </div>
              <div className="text-gray-500 text-sm mb-3">AWAY</div>
              <input
                type="number"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-20 h-16 text-3xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                min="0"
              />
            </div>

            {/* Period Selection */}
            <div className="text-center">
              <div className="text-gray-700 font-medium text-lg mb-3">PERIOD</div>
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="w-full px-4 py-3 text-left bg-white border-2 border-blue-500 rounded-lg focus:outline-none focus:border-blue-600 text-gray-700"
                >
                  {getSelectedPeriodLabel()}
                  <span className="float-right">▼</span>
                </button>
                
                {showPeriodDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Period Section */}
                    <div className="px-3 py-2 bg-gray-100 text-sm font-medium text-gray-700 border-b">
                      Period
                    </div>
                    {PERIOD_OPTIONS.slice(1, 7).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePeriodSelect(option.value)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                          period === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    
                    {/* Outcome Section */}
                    <div className="px-3 py-2 bg-gray-100 text-sm font-medium text-gray-700 border-b border-t">
                      Outcome
                    </div>
                    {PERIOD_OPTIONS.slice(0, 1).concat(PERIOD_OPTIONS.slice(7)).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePeriodSelect(option.value)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                          period === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickScoreModal;