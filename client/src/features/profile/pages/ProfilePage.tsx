import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateMyProfile } from '../api/profile';
import { Loader2, Edit2, Save, X, User } from 'lucide-react';

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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return <div className="text-center py-10">Profile not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Faculty Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-xl shadow-sm border dark:bg-gray-800 dark:border-gray-700">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Office Location</label>
                    <input
                      type="text"
                      value={formData.officeLocation}
                      onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form
                      setFormData({
                        name: profileData.name || '',
                        designation: facultyData?.designation || '',
                        phone: facultyData?.phone || '',
                        officeLocation: facultyData?.officeLocation || '',
                        bio: facultyData?.bio || '',
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</h3>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">{profileData.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Designation</h3>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">{facultyData?.designation || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">{facultyData?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Office Location</h3>
                    <p className="mt-1 text-base text-gray-900 dark:text-white">{facultyData?.officeLocation || 'Not provided'}</p>
                  </div>
                </div>

                {facultyData?.bio && (
                  <div className="pt-6 border-t dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</h3>
                    <p className="mt-2 text-base text-gray-900 whitespace-pre-wrap dark:text-white">
                      {facultyData.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-xl shadow-sm border dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profileData.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profileData.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {profileData.role}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-sm border dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Department Info</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Department</span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                  {facultyData?.department?.name || 'Not assigned'}
                </span>
              </div>
              {facultyData?.department?.code && (
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Code</span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                    {facultyData.department.code}
                  </span>
                </div>
              )}
              {facultyData?.employeeId && (
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Employee ID</span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-200">
                    {facultyData.employeeId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
