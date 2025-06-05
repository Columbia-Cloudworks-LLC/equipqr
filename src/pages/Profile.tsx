
import { Layout } from '@/components/Layout/Layout';
import { ProfileForm } from '@/components/Profile/ProfileForm';
import { ProfileLoadingState } from '@/components/Profile/LoadingState';
import { useProfileData } from '@/hooks/profile/useProfileData';

export default function Profile() {
  const { profileData, isLoading, userId, userOrgId } = useProfileData();

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        {isLoading ? (
          <ProfileLoadingState />
        ) : profileData && userId && userOrgId ? (
          <ProfileForm initialValues={profileData} userId={userId} userOrgId={userOrgId} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {!userOrgId 
                ? "Organization data not found. Please contact support." 
                : "Unable to load profile data"
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
