import React, { createContext, useContext, useEffect, useState } from 'react';
import { Team, TeamMember } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface TeamContextType {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  loading: boolean;
  setCurrentTeam: (team: Team | null) => void;
  fetchUserTeams: () => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'created_at' | 'invite_code'>) => Promise<any>;
  joinTeam: (inviteCode: string) => Promise<any>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUserTeams = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          teams (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const userTeams = data?.map(item => item.teams).filter(Boolean) || [];
      setTeams(userTeams as Team[]);
      
      if (userTeams.length > 0 && !currentTeam) {
        setCurrentTeam(userTeams[0] as Team);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      
      const members = data?.map(member => ({
        ...member,
        user: member.profiles,
      })) || [];
      
      setTeamMembers(members as TeamMember[]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: Omit<Team, 'id' | 'created_at' | 'invite_code'>) => {
    if (!user) return { error: 'User not authenticated' };

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          ...teamData,
          invite_code: inviteCode,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (data && !error) {
      await supabase
        .from('team_members')
        .insert([
          {
            team_id: data.id,
            user_id: user.id,
            role: 'manager',
          },
        ]);
      
      await fetchUserTeams();
    }

    return { data, error };
  };

  const joinTeam = async (inviteCode: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (teamError || !team) {
      return { error: 'Invalid invite code' };
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([
        {
          team_id: team.id,
          user_id: user.id,
          role: 'player',
        },
      ]);

    if (!error) {
      await fetchUserTeams();
    }

    return { data, error };
  };

  useEffect(() => {
    if (user) {
      fetchUserTeams();
    }
  }, [user]);

  useEffect(() => {
    if (currentTeam) {
      fetchTeamMembers(currentTeam.id);
    }
  }, [currentTeam]);

  const value = {
    teams,
    currentTeam,
    teamMembers,
    loading,
    setCurrentTeam,
    fetchUserTeams,
    fetchTeamMembers,
    createTeam,
    joinTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};