export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  description?: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  logo_url?: string;
  league_name?: string;
  season?: string;
  division?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'player' | 'captain' | 'manager';
  joined_at: string;
  user: User;
}

export interface Event {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  event_type: 'game' | 'practice' | 'meeting' | 'social';
  start_time: string;
  end_time: string;
  location?: string;
  created_by: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  user_id: string;
  status: 'yes' | 'no' | 'maybe' | 'pending';
  responded_at?: string;
}

export interface Fee {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  amount: number;
  due_date: string;
  created_by: string;
  created_at: string;
}

export interface Payment {
  id: string;
  fee_id: string;
  user_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
}

export interface Message {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  message_type: 'team' | 'private';
  created_at: string;
  sender: User;
}

export interface Task {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed';
  task_type: 'snacks' | 'drinks' | 'equipment' | 'other';
  created_by: string;
  created_at: string;
}