import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { User, Save, Upload } from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  // Contact Information
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Account Settings
  language: string;
  timezone: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  // Privacy Settings
  profile_visibility: string;
  show_email: boolean;
  show_phone: boolean;
  // Sports Preferences
  preferred_position: string;
  jersey_number: string;
  skill_level: string;
  years_experience: string;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'team_only', label: 'Team Members Only' },
  { value: 'private', label: 'Private' },
];

const SKILL_LEVEL_OPTIONS = [
  { value: '', label: 'Select Skill Level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    language: 'en',
    timezone: 'America/New_York',
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    profile_visibility: 'team_only',
    show_email: false,
    show_phone: false,
    preferred_position: '',
    jersey_number: '',
    skill_level: '',
    years_experience: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          email: user.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || 'United States',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          language: data.language || 'en',
          timezone: data.timezone || 'America/New_York',
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          push_notifications: data.push_notifications ?? true,
          profile_visibility: data.profile_visibility || 'team_only',
          show_email: data.show_email ?? false,
          show_phone: data.show_phone ?? false,
          preferred_position: data.preferred_position || '',
          jersey_number: data.jersey_number || '',
          skill_level: data.skill_level || '',
          years_experience: data.years_experience || '',
        });
      } else {
        // Set default values with user data
        setProfileData(prev => ({
          ...prev,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Avatar file must be smaller than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage('Please upload an image file');
        return;
      }

      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setMessage('');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      // Upload avatar if changed
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {avatarPreview || profileData.avatar_url ? (
                <img 
                  src={avatarPreview || profileData.avatar_url} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload className="h-3 w-3 text-white" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={profileData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            placeholder="Enter your first name"
          />
          <Input
            label="Last Name"
            value={profileData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            placeholder="Enter your last name"
          />
          <Input
            label="Full Name"
            value={profileData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="Enter your full name"
          />
          <Input
            label="Date of Birth"
            type="date"
            value={profileData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          />
          <Select
            label="Gender"
            value={profileData.gender}
            onChange={(value) => handleInputChange('gender', value)}
            options={GENDER_OPTIONS}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Email Address"
            type="email"
            value={profileData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={profileData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={profileData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your street address"
            />
          </div>
          <Input
            label="City"
            value={profileData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter your city"
          />
          <Input
            label="State/Province"
            value={profileData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="Enter your state or province"
          />
          <Input
            label="Postal Code"
            value={profileData.postal_code}
            onChange={(e) => handleInputChange('postal_code', e.target.value)}
            placeholder="Enter your postal code"
          />
          <Input
            label="Country"
            value={profileData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="Enter your country"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Emergency Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Emergency Contact Name"
            value={profileData.emergency_contact_name}
            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
            placeholder="Enter emergency contact name"
          />
          <Input
            label="Emergency Contact Phone"
            type="tel"
            value={profileData.emergency_contact_phone}
            onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
            placeholder="Enter emergency contact phone"
          />
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Language"
            value={profileData.language}
            onChange={(value) => handleInputChange('language', value)}
            options={LANGUAGE_OPTIONS}
          />
          <Select
            label="Timezone"
            value={profileData.timezone}
            onChange={(value) => handleInputChange('timezone', value)}
            options={TIMEZONE_OPTIONS}
          />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="email_notifications"
              checked={profileData.email_notifications}
              onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
              Email Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sms_notifications"
              checked={profileData.sms_notifications}
              onChange={(e) => handleInputChange('sms_notifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sms_notifications" className="ml-2 block text-sm text-gray-900">
              SMS Notifications
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="push_notifications"
              checked={profileData.push_notifications}
              onChange={(e) => handleInputChange('push_notifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="push_notifications" className="ml-2 block text-sm text-gray-900">
              Push Notifications
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy Settings</h2>
        <div className="space-y-6">
          <Select
            label="Profile Visibility"
            value={profileData.profile_visibility}
            onChange={(value) => handleInputChange('profile_visibility', value)}
            options={VISIBILITY_OPTIONS}
          />
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_email"
                checked={profileData.show_email}
                onChange={(e) => handleInputChange('show_email', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show_email" className="ml-2 block text-sm text-gray-900">
                Show email address to team members
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_phone"
                checked={profileData.show_phone}
                onChange={(e) => handleInputChange('show_phone', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show_phone" className="ml-2 block text-sm text-gray-900">
                Show phone number to team members
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Sports Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Preferred Position"
            value={profileData.preferred_position}
            onChange={(e) => handleInputChange('preferred_position', e.target.value)}
            placeholder="e.g., Forward, Midfielder, Goalie"
          />
          <Input
            label="Jersey Number"
            type="number"
            value={profileData.jersey_number}
            onChange={(e) => handleInputChange('jersey_number', e.target.value)}
            placeholder="Enter preferred jersey number"
          />
          <Select
            label="Skill Level"
            value={profileData.skill_level}
            onChange={(value) => handleInputChange('skill_level', value)}
            options={SKILL_LEVEL_OPTIONS}
          />
          <Input
            label="Years of Experience"
            type="number"
            value={profileData.years_experience}
            onChange={(e) => handleInputChange('years_experience', e.target.value)}
            placeholder="Enter years of experience"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={saving}
          className="px-8 py-3 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Profile;