import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeam } from '../../contexts/TeamContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import AuthLayout from './AuthLayout';

const JoinTeamForm: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { joinTeam } = useTeam();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <AuthLayout 
      title="Join a team" 
      subtitle="Enter your team's invite code to get started"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Join team
        </Button>

        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            Don't have an invite code?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
              Create a new team
            </Link>
          </div>
          
          <div className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default JoinTeamForm;