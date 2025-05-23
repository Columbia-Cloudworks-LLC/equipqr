
import React from 'react';
import { LegalPage } from '@/components/Legal/LegalPage';

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service">
      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to EquipQR, a service provided by Columbia Cloudworks LLC ("we", "us", or "our"). 
          By using EquipQR, you agree to comply with these Terms of Service ("Terms").
        </p>
      </section>

      <section>
        <h2>2. Service Description</h2>
        <p>
          EquipQR is a QR-based equipment management application designed for tracking equipment 
          inventories, attributes, and maintenance notes for businesses, particularly those 
          handling heavy machinery and related field services.
        </p>
      </section>

      <section>
        <h2>3. User Accounts</h2>
        <p>
          Users must register to access EquipQR. Users are responsible for maintaining the 
          confidentiality of their login credentials and are accountable for activities 
          conducted through their accounts.
        </p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to use EquipQR to:</p>
        <ul>
          <li>Conduct unlawful or fraudulent activities.</li>
          <li>Interfere with or disrupt the service or servers connected to the service.</li>
          <li>Upload harmful content, malware, or viruses.</li>
        </ul>
      </section>

      <section>
        <h2>5. Intellectual Property</h2>
        <p>
          Columbia Cloudworks LLC retains all rights, title, and interest in EquipQR, including 
          software, logos, trademarks, and any related intellectual property. Users are granted 
          a limited, non-exclusive, revocable license to access and use the service for its intended purposes.
        </p>
      </section>

      <section>
        <h2>6. Subscription and Billing</h2>
        <p>
          EquipQR operates on a subscription model. Fees are charged monthly unless otherwise 
          agreed. Subscriptions auto-renew unless canceled by the subscriber.
        </p>
      </section>

      <section>
        <h2>7. Termination</h2>
        <p>
          We reserve the right to terminate or suspend user accounts without notice for violations of these Terms.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>
          Columbia Cloudworks LLC is not liable for any indirect, incidental, special, consequential, or 
          punitive damages arising from or related to your use of EquipQR.
        </p>
      </section>

      <section>
        <h2>9. Changes to Terms</h2>
        <p>
          We may update these Terms occasionally. Users will be notified of significant changes, and 
          continued use of EquipQR after updates signifies acceptance of these changes.
        </p>
      </section>

      <section>
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and interpreted in accordance with the laws of the United States.
        </p>
      </section>
    </LegalPage>
  );
}
