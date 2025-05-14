
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, RefreshCw, Wrench, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

export interface OrganizationErrorProps {
  errorMessage: string;
  handleRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  diagnosticDetails?: any;
  handleRepairAccess?: () => Promise<void>;
  isRepairing?: boolean;
  userId?: string;
}

export function OrganizationError({ 
  errorMessage, 
  handleRefresh, 
  isRefreshing,
  diagnosticDetails,
  handleRepairAccess,
  isRepairing = false,
  userId
}: OrganizationErrorProps) {
  const { user } = useAuth();
  
  const hasIssues = diagnosticDetails?.issues && diagnosticDetails.issues.length > 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertTriangle className="h-5 w-5 mr-2" /> 
          Organization Not Found
        </CardTitle>
        <CardDescription>
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>We couldn't find an organization associated with your account or there may be an issue with your permissions.</p>
              <p className="text-sm text-muted-foreground">Possible reasons:</p>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li>Your account hasn't been properly set up with an organization</li>
                <li>The organization data is missing or corrupted</li>
                <li>You need to log out and log back in to refresh your session</li>
                <li>There might be a database configuration issue</li>
              </ul>
              {user && <p className="text-sm mt-2">User ID: {user.id}</p>}
            </div>
          </AlertDescription>
        </Alert>

        {diagnosticDetails && (
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="diagnostics">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  Diagnostic Information
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-3 bg-muted rounded-md text-sm space-y-3">
                  {diagnosticDetails.issues?.length > 0 ? (
                    <>
                      <p className="font-semibold">Found {diagnosticDetails.issues.length} potential issues:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {diagnosticDetails.issues.map((issue: string, idx: number) => (
                          <li key={idx} className="text-amber-700 dark:text-amber-400">{issue}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>No specific issues detected.</p>
                  )}
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium">Organization ID:</p>
                      <p className="text-muted-foreground">{diagnosticDetails.orgId || 'Not found'}</p>
                    </div>
                    <div>
                      <p className="font-medium">App User ID:</p>
                      <p className="text-muted-foreground">{diagnosticDetails.appUserId || 'Not found'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Profile Status:</p>
                      <p className={diagnosticDetails.hasValidProfile ? 'text-green-600' : 'text-red-600'}>
                        {diagnosticDetails.hasValidProfile ? 'Valid' : 'Missing or Invalid'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Roles Status:</p>
                      <p className={diagnosticDetails.hasValidRoles ? 'text-green-600' : 'text-red-600'}>
                        {diagnosticDetails.hasValidRoles ? 'Valid' : 'Missing or Invalid'}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRefresh} disabled={isRefreshing} className="mr-2">
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
          
          {handleRepairAccess && diagnosticDetails && hasIssues && (
            <Button 
              variant="outline" 
              onClick={handleRepairAccess}
              disabled={isRepairing}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
            >
              {isRepairing ? (
                <>
                  <Wrench className="h-4 w-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Attempt Repair
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" onClick={() => window.location.href = "/profile"} className="flex-shrink-0">
            <User className="h-4 w-4 mr-2" />
            Go to Profile
          </Button>
          
          <Button variant="outline" onClick={() => window.location.href = "/auth"} className="ml-auto flex-shrink-0">
            Sign Out and Back In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
