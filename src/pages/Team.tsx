import React, { useState, useEffect } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface TeamMemberWithStats {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  // Player stats (placeholder data)
  gamesPlayed: number;
  points: number;
  assists: number;
  ftm: number;
  oreb: number;
  dreb: number;
  threeFgm: number;
  pf: number;
  // Drinks duty data
  nextOnDuty: boolean;
  gamesPlayedDrinks: number;
  paid: number;
}

type ViewMode = 'roster' | 'drinks';

const Team: React.FC = () => {
  const { currentTeam, teamMembers, fetchTeamMembers } = useTeam();
  const [viewMode, setViewMode] = useState<ViewMode>('roster');
  const [members, setMembers] = useState<TeamMemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (currentTeam) {
      loadTeamData();
    }
  }, [currentTeam, teamMembers]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Transform team members with placeholder stats
      const membersWithStats: TeamMemberWithStats[] = teamMembers.map((member, index) => ({
        ...member,
        gamesPlayed: 0,
        points: index === 0 ? 2 : 0, // Give first member some sample data
        assists: index === 0 ? 3 : 0,
        ftm: 0,
        oreb: index === 0 ? 3 : 0,
        dreb: 0,
        threeFgm: 0,
        pf: 0,
        nextOnDuty: index === 0, // First member is next on duty
        gamesPlayedDrinks: 0,
        paid: 0,
      }));

      setMembers(membersWithStats);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.user.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const renderTabNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="bg-white rounded-full border border-gray-300 p-1 flex">
        <button
          onClick={() => setViewMode('roster')}
          className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'roster'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setViewMode('drinks')}
          className={`px-8 py-3 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'drinks'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Drinks
        </button>
      </div>
      <button className="ml-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );

  const renderRosterView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-600">Players</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by name"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">#</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                Name ▲
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">POS</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">GP</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Points</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Assists</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">FTM</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">OREB</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">DREB</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">3FGM</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">PF</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                  No team members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                        {member.user.full_name || member.user.email}
                      </div>
                      {member.role === 'manager' && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          MANAGER
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.gamesPlayed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.assists}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.ftm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.oreb}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.dreb}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.threeFgm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {member.pf}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredMembers.length} Player{filteredMembers.length !== 1 ? 's' : ''}
          </div>
          <div className="flex space-x-4">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Add Player
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Invite Players
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Import
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDrinksView = () => {
    const players = filteredMembers.filter(member => member.role === 'player' || member.role === 'manager');
    const spares = filteredMembers.filter(member => member.role === 'spare');

    return (
      <div className="space-y-8">
        {/* Players Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-600">Players</h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">#</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Name ▲
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Next On Duty</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Games Played</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Paid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No players found
                    </td>
                  </tr>
                ) : (
                  players.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {member.user.full_name || member.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.nextOnDuty ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">NEXT ON DUTY</span>
                            <span className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                              SKIP
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.gamesPlayedDrinks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {member.paid}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Players Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {players.length} Player{players.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Spares Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-600">Spares</h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">#</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Name ▲
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Next On Duty</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Games Played</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Paid</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {spares.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-32 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">No spares assigned to this team</div>
                        <div className="text-sm">{spares.length} Spares</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  spares.map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {member.user.full_name || member.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.nextOnDuty ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">NEXT ON DUTY</span>
                            <span className="text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                              SKIP
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.gamesPlayedDrinks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {member.paid}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Spares Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {spares.length} Spares
              </div>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Edit Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      {viewMode === 'roster' ? renderRosterView() : renderDrinksView()}
    </div>
  );
};

export default Team;