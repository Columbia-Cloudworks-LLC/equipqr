import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              EquipQR ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you use our fleet equipment 
              management platform and services.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <h4>Personal Information</h4>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>Account credentials and authentication data</li>
              <li>Organization and team information</li>
              <li>Profile information and preferences</li>
            </ul>
            
            <h4>Equipment and Operational Data</h4>
            <ul>
              <li>Equipment details, specifications, and maintenance records</li>
              <li>Work order information and status updates</li>
              <li>Location data and equipment tracking information</li>
              <li>Images and documents uploaded to the platform</li>
            </ul>

            <h4>Usage Information</h4>
            <ul>
              <li>Log data, including IP addresses and browser information</li>
              <li>Device information and operating system details</li>
              <li>Usage patterns and feature interaction data</li>
              <li>Performance and analytics data</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide, operate, and maintain our services</li>
              <li>Process transactions and manage your account</li>
              <li>Send important notices, updates, and support communications</li>
              <li>Improve our services and develop new features</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Ensure security and prevent fraudulent activities</li>
              <li>Comply with legal obligations and resolve disputes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Information Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Within Your Organization:</strong> With team members and administrators in your organization</li>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in providing our services</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>We implement appropriate technical and organizational measures to protect your information:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and monitoring</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data centers and infrastructure</li>
              <li>Employee training on data protection practices</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              We retain your information for as long as necessary to provide our services and fulfill the purposes 
              outlined in this Privacy Policy. We may retain certain information for longer periods as required by 
              law or for legitimate business purposes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request information about the data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Restriction:</strong> Request limitation of how we process your data</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide 
              personalized content. You can control cookie settings through your browser preferences.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Your information may be processed and stored in countries other than your own. We ensure appropriate 
              safeguards are in place to protect your data in accordance with applicable privacy laws.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children under 18 years of age.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              Email: privacy@equipqr.com<br />
              Website: https://equipqr.com<br />
              Address: [Company Address]
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}