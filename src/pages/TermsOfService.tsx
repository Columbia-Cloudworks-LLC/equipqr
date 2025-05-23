
import React from 'react';
import { LegalPage } from '@/components/Legal/LegalPage';
import { 
  FileText, 
  Server, 
  UserCheck, 
  Shield, 
  Copyright, 
  CreditCard, 
  Ban, 
  Scales, 
  RefreshCw, 
  Gavel 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TermsOfService() {
  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LegalPage title="Terms of Service" className="space-y-8">
      {/* Table of Contents */}
      <Card className="bg-accent/20">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contents
          </h2>
          <nav className="space-y-1">
            {[
              { id: "introduction", title: "Introduction" },
              { id: "service", title: "Service Description" },
              { id: "accounts", title: "User Accounts" },
              { id: "acceptable-use", title: "Acceptable Use" },
              { id: "intellectual-property", title: "Intellectual Property" },
              { id: "subscription", title: "Subscription and Billing" },
              { id: "termination", title: "Termination" },
              { id: "liability", title: "Limitation of Liability" },
              { id: "changes", title: "Changes to Terms" },
              { id: "governing-law", title: "Governing Law" }
            ].map((section) => (
              <a 
                key={section.id}
                href={`#${section.id}`}
                className="block p-2 hover:bg-accent/50 rounded-md transition-colors"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Policy Sections */}
      <div className="space-y-8">
        <Card id="introduction" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <FileText className="h-6 w-6" />
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to EquipQR, a service provided by Columbia Cloudworks LLC ("we", "us", or "our"). 
              By using EquipQR, you agree to comply with these Terms of Service ("Terms").
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="service" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Server className="h-6 w-6" />
              2. Service Description
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              EquipQR is a QR-based equipment management application designed for tracking equipment 
              inventories, attributes, and maintenance notes for businesses, particularly those 
              handling heavy machinery and related field services.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="accounts" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <UserCheck className="h-6 w-6" />
              3. User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Users must register to access EquipQR. Users are responsible for maintaining the 
              confidentiality of their login credentials and are accountable for activities 
              conducted through their accounts.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="acceptable-use" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Shield className="h-6 w-6" />
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground mb-3">You agree not to use EquipQR to:</p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground ml-4">
              <li className="pl-2">Conduct unlawful or fraudulent activities.</li>
              <li className="pl-2">Interfere with or disrupt the service or servers connected to the service.</li>
              <li className="pl-2">Upload harmful content, malware, or viruses.</li>
            </ul>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="intellectual-property" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Copyright className="h-6 w-6" />
              5. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Columbia Cloudworks LLC retains all rights, title, and interest in EquipQR, including 
              software, logos, trademarks, and any related intellectual property. Users are granted 
              a limited, non-exclusive, revocable license to access and use the service for its intended purposes.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="subscription" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <CreditCard className="h-6 w-6" />
              6. Subscription and Billing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              EquipQR operates on a subscription model. Fees are charged monthly unless otherwise 
              agreed. Subscriptions auto-renew unless canceled by the subscriber.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="termination" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Ban className="h-6 w-6" />
              7. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend user accounts without notice for violations of these Terms.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="liability" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Scales className="h-6 w-6" />
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Columbia Cloudworks LLC is not liable for any indirect, incidental, special, consequential, or 
              punitive damages arising from or related to your use of EquipQR.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="changes" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <RefreshCw className="h-6 w-6" />
              9. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms occasionally. Users will be notified of significant changes, and 
              continued use of EquipQR after updates signifies acceptance of these changes.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="governing-law" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Gavel className="h-6 w-6" />
              10. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and interpreted in accordance with the laws of the United States.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-friendly accordion for small screens */}
      <div className="block md:hidden mt-8">
        <h3 className="text-lg font-medium mb-4">Quick Navigation</h3>
        <Accordion type="single" collapsible className="w-full">
          {[
            { id: "introduction", title: "Introduction", icon: FileText },
            { id: "service", title: "Service Description", icon: Server },
            { id: "accounts", title: "User Accounts", icon: UserCheck },
            { id: "acceptable-use", title: "Acceptable Use", icon: Shield },
            { id: "intellectual-property", title: "Intellectual Property", icon: Copyright },
            { id: "subscription", title: "Subscription and Billing", icon: CreditCard },
            { id: "termination", title: "Termination", icon: Ban },
            { id: "liability", title: "Limitation of Liability", icon: Scales },
            { id: "changes", title: "Changes to Terms", icon: RefreshCw },
            { id: "governing-law", title: "Governing Law", icon: Gavel }
          ].map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <a 
                  href={`#${section.id}`}
                  className="flex w-full p-2 bg-accent/20 rounded-md justify-center"
                >
                  Go to section
                </a>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </LegalPage>
  );
}
