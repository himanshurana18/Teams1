import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create team form
  const [teamName, setTeamName] = useState('');
  const [sport, setSport] = useState('');
  const [description, setDescription] = useState('');
  
  // Join team form
  const [inviteCode, setInviteCode] = useState('');
  
  const { createTeam, joinTeam } = useTeam();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1 && choice) {
      setStep(2);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await createTeam({
        name: teamName,
        sport: sport,
        description: description,
        created_by: '',
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await joinTeam(inviteCode);
      if (error) {
        setError(error);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <OnboardingLayout
      step={1}
      totalSteps={2}
      title="Welcome to TeamManager"
      subtitle="Let's get you set up with your first team"
    >
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            How would you like to get started?
          </h3>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setChoice('create')}
            className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
              choice === 'create'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Create a new team</div>
            <div className="text-sm text-gray-600 mt-1">
              Start fresh and invite your teammates
            </div>
          </button>

          <button
            onClick={() => setChoice('join')}
            className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
              choice === 'join'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Join an existing team</div>
            <div className="text-sm text-gray-600 mt-1">
              Use an invite code from your team manager
            </div>
          </button>
        </div>

        <Button
          onClick={handleNext}
          disabled={!choice}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </OnboardingLayout>
  );

  const renderStep2 = () => {
    if (choice === 'create') {
      return (
        <OnboardingLayout
          step={2}
          totalSteps={2}
          title="Create your team"
          subtitle="Tell us about your team"
        >
          <form onSubmit={handleCreateTeam} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Team name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Warriors FC"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a sport</option>
                <option value="soccer">Soccer</option>
                <option value="basketball">Basketball</option>
                <option value="baseball">Baseball</option>
                <option value="football">Football</option>
                <option value="volleyball">Volleyball</option>
                <option value="tennis">Tennis</option>
                <option value="hockey">Hockey</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Description (optional)"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your team"
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                Create team
              </Button>
            </div>
          </form>
        </OnboardingLayout>
      );
    }

    return (
      <OnboardingLayout
        step={2}
        totalSteps={2}
        title="Join a team"
        subtitle="Enter your team's invite code"
      >
        <form onSubmit={handleJoinTeam} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Invite code"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            required
            className="text-center text-lg font-mono tracking-wider"
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Join team
            </Button>
          </div>
        </form>
      </OnboardingLayout>
    );
  };

  return step === 1 ? renderStep1() : renderStep2();
};

export default Onboarding;