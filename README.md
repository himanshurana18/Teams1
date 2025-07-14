# Sports Team Management Application

A comprehensive web application for managing sports teams, similar to BenchApp.com. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Authentication
- Email & password login/signup
- Secure JWT-based sessions with Supabase Auth
- Password reset functionality
- Three ways to get started: join existing team, create new team, or login to existing account

### Team Management
- Create and manage multiple teams
- Role-based access (Player, Captain, Manager)
- Unique invite codes for team joining
- Team switcher for users with multiple teams
- Member management and role assignment

### Dashboard
- Overview of team statistics and key metrics
- Upcoming events and quick actions
- Team member visualization
- Real-time data updates

### Profile & Settings
- User profile management
- Team settings and configuration
- Role-based permissions system

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase account and project

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Copy `.env.example` to `.env` and fill in your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Set up the database schema**:
   You'll need to create the following tables in your Supabase project:

   ```sql
   -- Enable RLS
   ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

   -- Profiles table (extends auth.users)
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     full_name TEXT,
     phone TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'America/New_York',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    profile_visibility TEXT DEFAULT 'team_only',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    preferred_position TEXT,
    jersey_number INT,
    skill_level TEXT,
    years_experience INT,
     PRIMARY KEY (id)
   );

   -- Teams table
   CREATE TABLE teams (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     sport TEXT NOT NULL,
     description TEXT,
     invite_code TEXT UNIQUE NOT NULL,
     created_by UUID REFERENCES auth.users(id),
     logo_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Team members table
   CREATE TABLE team_members (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     role TEXT CHECK (role IN ('player', 'captain', 'manager')) DEFAULT 'player',
     joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(team_id, user_id)
   );

   -- Events table
   CREATE TABLE events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     event_type TEXT CHECK (event_type IN ('game', 'practice', 'meeting', 'social')) DEFAULT 'game',
     start_time TIMESTAMP WITH TIME ZONE NOT NULL,
     end_time TIMESTAMP WITH TIME ZONE NOT NULL,
     location TEXT,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Attendance table
   CREATE TABLE attendance (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     event_id UUID REFERENCES events(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     status TEXT CHECK (status IN ('yes', 'no', 'maybe', 'pending')) DEFAULT 'pending',
     responded_at TIMESTAMP WITH TIME ZONE,
     UNIQUE(event_id, user_id)
   );

   -- Fees table
   CREATE TABLE fees (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     amount DECIMAL(10,2) NOT NULL,
     due_date TIMESTAMP WITH TIME ZONE NOT NULL,
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Payments table
   CREATE TABLE payments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     amount DECIMAL(10,2) NOT NULL,
     status TEXT CHECK (status IN ('paid', 'pending', 'overdue')) DEFAULT 'pending',
     paid_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(fee_id, user_id)
   );

   -- Messages table
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES auth.users(id),
     content TEXT NOT NULL,
     message_type TEXT CHECK (message_type IN ('team', 'private')) DEFAULT 'team',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Tasks table
   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     description TEXT,
     assigned_to UUID REFERENCES auth.users(id),
     due_date TIMESTAMP WITH TIME ZONE,
     status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
     task_type TEXT CHECK (task_type IN ('snacks', 'drinks', 'equipment', 'other')) DEFAULT 'other',
     created_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
   ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
   ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

   -- RLS Policies (basic examples - customize as needed)
   CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

   -- Team policies - users can only access teams they're members of
   CREATE POLICY "Team members can view team" ON teams FOR SELECT 
   USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

   CREATE POLICY "Team members can view team members" ON team_members FOR SELECT 
   USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication forms
│   ├── dashboard/       # Dashboard-specific components
│   ├── layout/          # Layout components (sidebar, header)
│   ├── onboarding/      # Onboarding flow components
│   └── ui/              # Basic UI components (Button, Input, etc.)
├── contexts/            # React contexts for state management
│   ├── AuthContext.tsx  # Authentication state
│   └── TeamContext.tsx  # Team-related state
├── lib/                 # Utility functions and configurations
│   ├── supabase.ts      # Supabase client setup
│   └── utils.ts         # Helper functions
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard
│   └── Onboarding.tsx   # New user onboarding
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared types
└── App.tsx              # Main app component with routing
```

## Key Features Implemented

### Authentication Flow
- **Login/Signup**: Complete authentication with Supabase Auth
- **Onboarding**: Guided setup for new users
- **Team Joining**: Join existing teams with invite codes
- **Protected Routes**: Secure access to dashboard features

### Team Management
- **Multi-team Support**: Users can belong to multiple teams
- **Role-based Access**: Different permissions for players, captains, and managers
- **Team Creation**: Easy team setup with invite code generation
- **Member Management**: View and manage team members

### Dashboard
- **Statistics Overview**: Key metrics and team stats
- **Upcoming Events**: Quick view of scheduled activities
- **Quick Actions**: Common tasks accessible from dashboard
- **Team Switching**: Easy navigation between multiple teams

## Future Enhancements

The application is designed to be extended with additional features:

- **Event Scheduling**: Full calendar functionality with RSVP
- **Attendance Tracking**: Automated attendance management
- **Team Messaging**: Internal communication system
- **Financial Management**: Fee tracking and payment processing
- **Task Assignment**: Duty rotation and task management
- **Mobile App**: PWA support for mobile devices
- **Notifications**: Email and SMS alerts
- **Analytics**: Team performance and engagement metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.