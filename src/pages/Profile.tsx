
import { useProfileData } from "@/hooks/profile/useProfileData";
import { Layout } from "@/components/Layout/Layout";
import { ProfileForm } from "@/components/Profile/ProfileForm";
import { ProfileLoadingState } from "@/components/Profile/LoadingState";

export default function Profile() {
  const { profileData, isLoading, userId } = useProfileData();

  if (isLoading) {
    return (
      <Layout>
        <ProfileLoadingState />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

        {profileData && userId && (
          <ProfileForm initialValues={profileData} userId={userId} />
        )}
      </div>
    </Layout>
  );
}
