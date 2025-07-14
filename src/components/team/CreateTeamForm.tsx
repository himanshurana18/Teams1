import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, Users, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface TeamFormData {
  // Step 1: Basic Info
  fullName: string;
  email: string;
  teamName: string;
  
  // Step 2: Team Details
  leagueName: string;
  season: string;
  division: string;
  sport: string;
  logoFile?: File;
}

const SPORTS_OPTIONS = [
  { value: 'hockey', label: 'Hockey' },
  { value: 'other', label: 'Other' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'football', label: 'Football' },
  { value: 'golf', label: 'Golf' },
  { value: 'pickleball', label: 'Pickleball' },
  { value: 'lacrosse', label: 'Lacrosse' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'ultimate', label: 'Ultimate' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'softball', label: 'Softball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'street-hockey', label: 'Street Hockey' },
  { value: 'ball-hockey', label: 'Ball Hockey' },
  { value: 'roller-hockey', label: 'Roller Hockey' },
];

const CreateTeamForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { createTeam } = useTeam();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TeamFormData>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    teamName: '',
    leagueName: '',
    season: '',
    division: '',
    sport: 'hockey',
  });

  const [errors, setErrors] = useState<Partial<TeamFormData>>({});

  const updateFormData = (field: keyof TeamFormData, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<TeamFormData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<TeamFormData> = {};
    
    if (!formData.leagueName.trim()) {
      newErrors.leagueName = 'League name is required';
    }
    
    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }
    
    if (!formData.division.trim()) {
      newErrors.division = 'Division is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Logo file must be smaller than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      updateFormData('logoFile', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const teamData = {
        name: formData.teamName,
        sport: formData.sport,
        description: `${formData.leagueName} - ${formData.season} - ${formData.division}`,
        created_by: user?.id || '',
      };

      const { data, error } = await createTeam(teamData);
      
      if (error) {
        setError(error.message || 'Failed to create team');
      } else {
        // Show success and redirect
        navigate('/dashboard', { 
          state: { 
            message: `Team "${formData.teamName}" created successfully!`,
            inviteCode: data?.invite_code 
          }
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTeamPreview = () => {
    if (!formData.teamName && !formData.season) return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            {logoPreview ? (
              <img src={logoPreview} alt="Team logo" className="h-10 w-10 rounded object-cover" />
            ) : (
              <Trophy className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {formData.teamName || 'Your Team Name'}
            </h3>
            <p className="text-sm text-gray-600">
              {formData.season || 'Season'} {formData.division && `• ${formData.division}`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Your Team</h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {currentStep} of 2 - {currentStep === 1 ? 'Basic Information' : 'Team Details'}
          </p>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {currentStep === 1 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600 mt-1">Tell us about yourself and your team</p>
              </div>

              <Input
                label="Full Name"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                placeholder="Enter your full name"
                error={errors.fullName}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your.email@example.com"
                error={errors.email}
                required
              />

              <Input
                label="Team Name"
                type="text"
                value={formData.teamName}
                onChange={(e) => updateFormData('teamName', e.target.value)}
                placeholder="e.g., Lightning Bolts, Warriors FC"
                error={errors.teamName}
                required
              />

              {getTeamPreview()}

              <Button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Team Details</h3>
                <p className="text-sm text-gray-600 mt-1">Complete your team setup</p>
              </div>

              <Input
                label="League Name"
                type="text"
                value={formData.leagueName}
                onChange={(e) => updateFormData('leagueName', e.target.value)}
                placeholder="e.g., NHL, Premier League, City League"
                error={errors.leagueName}
                required
              />

              <Input
                label="Season"
                type="text"
                value={formData.season}
                onChange={(e) => updateFormData('season', e.target.value)}
                placeholder="e.g., Winter 2025/26, Spring 2025"
                error={errors.season}
                required
              />

              <Input
                label="Division"
                type="text"
                value={formData.division}
                onChange={(e) => updateFormData('division', e.target.value)}
                placeholder="e.g., Div 1, Division A, Recreational"
                error={errors.division}
                required
              />

              <Select
                label="Sport"
                value={formData.sport}
                onChange={(value) => updateFormData('sport', value)}
                options={SPORTS_OPTIONS}
                required
              />

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Logo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded object-cover mb-2" />
                        ) : (
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        )}
                        <p className="text-xs text-gray-500">
                          {logoPreview ? 'Click to change' : 'Upload team logo'}
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {getTeamPreview()}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  className="flex-1"
                >
                  Create Team
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTeamForm;