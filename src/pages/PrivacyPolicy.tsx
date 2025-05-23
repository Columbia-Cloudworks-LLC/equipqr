
import React from 'react';
import { LegalPage } from '@/components/Legal/LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Columbia Cloudworks LLC ("we", "our", or "us") values your privacy. This Privacy Policy 
          outlines how we collect, use, and protect your information through EquipQR.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p><strong>Personal Information:</strong> Name, email, job title, organization name, contact information.</p>
        <p><strong>Usage Data:</strong> Information on how you access and use EquipQR, including device type, browser details, and IP addresses.</p>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and maintain EquipQR.</li>
          <li>To manage user accounts and provide customer support.</li>
          <li>To improve our services based on user feedback and usage data.</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We do not sell or lease your personal data. We may share data with third-party service 
          providers solely to facilitate EquipQR services (e.g., cloud storage providers, authentication services).
        </p>
      </section>

      <section>
        <h2>5. Security</h2>
        <p>
          We implement robust security measures, including encryption and regular audits, to protect 
          your personal information. However, no online service is completely secure, and users must 
          protect their own account details.
        </p>
      </section>

      <section>
        <h2>6. Cookies</h2>
        <p>
          EquipQR uses cookies to enhance user experience, track service usage, and manage sessions.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain your data as long as your account is active or as necessary to provide you with 
          EquipQR services. Data can be deleted upon request, subject to any legal retention obligations.
        </p>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>
          You have the right to access, modify, or delete your personal data stored with us. 
          Requests can be sent to support@equipqr.ai.
        </p>
      </section>

      <section>
        <h2>9. Changes to Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Significant changes will be 
          communicated to users via email or in-app notifications.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          For questions about these policies, please contact us at:
        </p>
        <p>
          Columbia Cloudworks LLC<br />
          support@equipqr.ai
        </p>
      </section>
    </LegalPage>
  );
}
