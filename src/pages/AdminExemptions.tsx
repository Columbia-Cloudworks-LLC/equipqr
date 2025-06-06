
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { BillingExemptionSetup } from '@/components/Admin/BillingExemptionSetup';

export default function AdminExemptions() {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin: Billing Exemptions</h1>
            <p className="text-muted-foreground mt-2">
              Set up billing exemptions for organizations
            </p>
          </div>
          
          <BillingExemptionSetup />
        </div>
      </div>
    </Layout>
  );
}
