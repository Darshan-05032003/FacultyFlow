import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateMyProfile } from '../api/profile';
import { Loader2, Edit2, Save, X, User } from 'lucide-react';
import { PageHeader, SectionCard, LoadingState } from '../../../components/ui/SharedComponents';

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phone: '',
    officeLocation: '',
    bio: '',
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const profileData = data?.data;
  const facultyData = profileData?.facultyProfile;

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        designation: facultyData?.designation || '',
        phone: facultyData?.phone || '',
        officeLocation: facultyData?.officeLocation || '',
        bio: facultyData?.bio || '',
      });
    }
  }, [profileData]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['profile'], updatedData);
      queryClient.invalidateQueries({ queryKey: ['me'] }); // update global user name
      setIsEditing(false);
      setError('');
    },
    onError: (err: any) => {
      setError(err?.error?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Faculty Profile" />
        <LoadingState message="Loading profile..." />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="space-y-6">
        <PageHeader title="Faculty Profile" />
        <div className="text-center py-10 text-gray-500">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Faculty Profile" 
          subtitle="Manage your personal information and biography."
        />
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          <SectionCard noPadding>
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Office Location</label>
                      <input
                        type="text"
                        value={formData.officeLocation}
                        onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: profileData.name || '',
                          designation: facultyData?.designation || '',
                          phone: facultyData?.phone || '',
                          officeLocation: facultyData?.officeLocation || '',
                          bio: facultyData?.bio || '',
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                      <p className="mt-1 text-base font-medium text-gray-900">{profileData.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Designation</h3>
                      <p className="mt-1 text-base text-gray-900">{facultyData?.designation || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <p className="mt-1 text-base text-gray-900">{facultyData?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Office Location</h3>
                      <p className="mt-1 text-base text-gray-900">{facultyData?.officeLocation || 'Not provided'}</p>
                    </div>
                  </div>

                  {facultyData?.bio && (
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                      <p className="mt-2 text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {facultyData.bio}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <SectionCard noPadding>
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{profileData.name}</h2>
                <p className="text-sm text-gray-500">{profileData.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {profileData.role}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Department Info">
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Department</span>
                <span className="block text-sm font-medium text-gray-900">
                  {facultyData?.department?.name || 'Not assigned'}
                </span>
              </div>
              {facultyData?.department?.code && (
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code</span>
                  <span className="block text-sm font-medium text-gray-900">
                    {facultyData.department.code}
                  </span>
                </div>
              )}
              {facultyData?.employeeId && (
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Employee ID</span>
                  <span className="block text-sm font-medium text-gray-900">
                    {facultyData.employeeId}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
