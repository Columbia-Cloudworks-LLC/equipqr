
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignUpFormFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  displayName: string;
  setDisplayName: (displayName: string) => void;
  jobTitle: string;
  setJobTitle: (jobTitle: string) => void;
  organizationName: string;
  setOrganizationName: (organizationName: string) => void;
}

export function SignUpFormFields({
  email,
  setEmail,
  password,
  setPassword,
  displayName,
  setDisplayName,
  jobTitle,
  setJobTitle,
  organizationName,
  setOrganizationName
}: SignUpFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email *</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="email@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password *</Label>
        <Input
          id="signup-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display-name">Name</Label>
        <Input
          id="display-name"
          type="text"
          placeholder="Your Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job-title">Job Title</Label>
        <Input
          id="job-title"
          type="text"
          placeholder="Your Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organization-name">Organization Name</Label>
        <Input
          id="organization-name"
          type="text"
          placeholder="Your Organization"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
        />
      </div>
    </>
  );
}
