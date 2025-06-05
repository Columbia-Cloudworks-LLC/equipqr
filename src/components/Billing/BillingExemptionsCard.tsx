import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Info, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BillingExemption {
  id: string;
  exemption_type: 'full' | 'partial';
  free_user_count?: number;
  reason?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export function BillingExemptionsCard() {
  const { selectedOrganization } = useOrganization();
  const [exemption, setExemption] = useState<BillingExemption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedOrganization?.id) {
      fetchExemption();
    }
  }, [selectedOrganization?.id]);

  const fetchExemption = async () => {
    if (!selectedOrganization?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('organization_billing_exemptions')
        .select('*')
        .eq('org_id', selectedOrganization.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching billing exemption:', error);
        return;
      }

      // Type assertion to ensure exemption_type is properly typed
      if (data) {
        const typedExemption: BillingExemption = {
          ...data,
          exemption_type: data.exemption_type as 'full' | 'partial'
        };
        setExemption(typedExemption);
      } else {
        setExemption(null);
      }
    } catch (error) {
      console.error('Error fetching billing exemption:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Billing Exemptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Billing Exemptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exemption ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your organization has an active billing exemption.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exemption Type:</span>
                <Badge variant={exemption.exemption_type === 'full' ? 'default' : 'secondary'}>
                  {exemption.exemption_type === 'full' ? 'Full Exemption' : 'Partial Exemption'}
                </Badge>
              </div>

              {exemption.exemption_type === 'partial' && exemption.free_user_count && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Free Users:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{exemption.free_user_count} users</span>
                  </div>
                </div>
              )}

              {exemption.reason && (
                <div className="space-y-1">
                  <span className="text-sm font-medium">Reason:</span>
                  <p className="text-sm text-muted-foreground">{exemption.reason}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Active
                </Badge>
              </div>

              {exemption.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(exemption.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No billing exemptions are currently active for your organization.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
