import React, { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, CheckCircle, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext';
import { supabase } from '../lib/supabase';
import { Event, Fee } from '../types';
import Button from '../components/ui/Button';

const Dashboard: React.FC = () => {
  const { currentTeam, teamMembers } = useTeam();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [unpaidFees, setUnpaidFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Show success message if redirected from team creation
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null
  );
  const [inviteCode, setInviteCode] = useState<string | null>(
    location.state?.inviteCode || null
  );

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setInviteCode(null);
      }, 10000); // Hide after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (currentTeam) {
      fetchDashboardData();
    }
  }, [currentTeam]);

  const fetchDashboardData = async () => {
    if (!currentTeam) return;

    setLoading(true);
    try {
      // Fetch upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', currentTeam.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      // Fetch unpaid fees
      const { data: fees } = await supabase
        .from('fees')
        .select('*')
        .eq('team_id', currentTeam.id)
        .gte('due_date', new Date().toISOString());

      setUpcomingEvents(events || []);
      setUnpaidFees(fees || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-gray-900">No Team Selected</h1>
              <p className="text-sm text-gray-500">Select a team to get started</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-600 mb-8">
              Create a new team or join an existing one to start managing your sports team.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/create-team">
                <Button className="px-8 py-3">Create Team</Button>
              </Link>
              <Link to="/join">
                <Button variant="outline" className="px-8 py-3">Join Team</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Team Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-bold text-gray-900">{currentTeam.name}</h1>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <span>{currentTeam.season || 'Season'}</span>
              <span>•</span>
              <span>{teamMembers.length} members</span>
              <span>•</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                {currentTeam.invite_code}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="bg-blue-500 text-white px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Let your players set their attendance with a text message — Try FREE for 30 days!
          </span>
          <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-500">
            Upgrade Today
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
              {inviteCode && (
                <div className="mt-2">
                  <p className="text-sm text-green-700">
                    Your team invite code is:{' '}
                    <span className="font-mono bg-green-100 px-2 py-1 rounded font-bold">
                      {inviteCode}
                    </span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Share this code with your teammates so they can join!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[60vh] px-6 py-12">
        <div className="text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">New Season Started</h2>
          <p className="text-lg text-gray-600 mb-12">
            Now let's start building your roster and schedule.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mb-12">
            <Button className="px-8 py-4 text-lg">
              Build Roster
            </Button>
            <Button className="px-8 py-4 text-lg">
              Create Schedule
            </Button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-6 justify-center text-blue-600">
            <Link to="/help" className="hover:text-blue-800 transition-colors">
              Frequently Asked Questions
            </Link>
            <Link to="/team" className="hover:text-blue-800 transition-colors">
              Edit Team Profile
            </Link>
            <Link to="/settings" className="hover:text-blue-800 transition-colors">
              Configure Team Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;