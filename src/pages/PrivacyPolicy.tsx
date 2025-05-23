
import React from 'react';
import { LegalPage } from '@/components/Legal/LegalPage';
import { 
  Shield, 
  User, 
  BarChart, 
  Share2, 
  Lock, 
  Cookie, 
  Clock, 
  FileText, 
  RefreshCw, 
  Mail 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PrivacyPolicy() {
  // Function to scroll back to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LegalPage title="Privacy Policy" className="space-y-8">
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
              { id: "information", title: "Information We Collect" },
              { id: "usage", title: "How We Use Your Information" },
              { id: "sharing", title: "Data Sharing" },
              { id: "security", title: "Security" },
              { id: "cookies", title: "Cookies" },
              { id: "retention", title: "Data Retention" },
              { id: "rights", title: "Your Rights" },
              { id: "changes", title: "Changes to Privacy Policy" },
              { id: "contact", title: "Contact" }
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
              <Shield className="h-6 w-6" />
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Columbia Cloudworks LLC ("we", "our", or "us") values your privacy. This Privacy Policy 
              outlines how we collect, use, and protect your information through EquipQR.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="information" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <User className="h-6 w-6" />
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="pl-4 border-l-2 border-accent">
                <p className="font-semibold">Personal Information:</p>
                <p className="text-muted-foreground">Name, email, job title, organization name, contact information.</p>
              </div>
              <div className="pl-4 border-l-2 border-accent">
                <p className="font-semibold">Usage Data:</p>
                <p className="text-muted-foreground">Information on how you access and use EquipQR, including device type, browser details, and IP addresses.</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="usage" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <BarChart className="h-6 w-6" />
              3. How We Use Your Information
            </h2>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li className="pl-2">To provide, operate, and maintain EquipQR.</li>
              <li className="pl-2">To manage user accounts and provide customer support.</li>
              <li className="pl-2">To improve our services based on user feedback and usage data.</li>
            </ul>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="sharing" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Share2 className="h-6 w-6" />
              4. Data Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell or lease your personal data. We may share data with third-party service 
              providers solely to facilitate EquipQR services (e.g., cloud storage providers, authentication services).
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="security" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Lock className="h-6 w-6" />
              5. Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement robust security measures, including encryption and regular audits, to protect 
              your personal information. However, no online service is completely secure, and users must 
              protect their own account details.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="cookies" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Cookie className="h-6 w-6" />
              6. Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              EquipQR uses cookies to enhance user experience, track service usage, and manage sessions.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="retention" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Clock className="h-6 w-6" />
              7. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data as long as your account is active or as necessary to provide you with 
              EquipQR services. Data can be deleted upon request, subject to any legal retention obligations.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="rights" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <FileText className="h-6 w-6" />
              8. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, modify, or delete your personal data stored with us. 
              Requests can be sent to support@equipqr.ai.
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
              9. Changes to Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Significant changes will be 
              communicated to users via email or in-app notifications.
            </p>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={scrollToTop} className="text-xs">
                Back to top ↑
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="contact" className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Mail className="h-6 w-6" />
              10. Contact
            </h2>
            <p className="text-muted-foreground mb-2">
              For questions about these policies, please contact us at:
            </p>
            <div className="bg-accent/20 p-4 rounded-md">
              <p className="font-medium">Columbia Cloudworks LLC</p>
              <p className="text-primary">support@equipqr.ai</p>
            </div>
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
            { id: "introduction", title: "Introduction", icon: Shield },
            { id: "information", title: "Information We Collect", icon: User },
            { id: "usage", title: "How We Use Your Information", icon: BarChart },
            { id: "sharing", title: "Data Sharing", icon: Share2 },
            { id: "security", title: "Security", icon: Lock },
            { id: "cookies", title: "Cookies", icon: Cookie },
            { id: "retention", title: "Data Retention", icon: Clock },
            { id: "rights", title: "Your Rights", icon: FileText },
            { id: "changes", title: "Changes to Privacy Policy", icon: RefreshCw },
            { id: "contact", title: "Contact", icon: Mail }
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
