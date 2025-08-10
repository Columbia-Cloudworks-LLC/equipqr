import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Users, Building } from 'lucide-react';

const SocialProofSection = () => {
  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Proven in the Field
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Currently deployed with industry leaders who trust EquipQR to manage their critical equipment operations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Primary Client Highlight */}
          <Card className="lg:col-span-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <Building className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">3-A Equipment</h3>
                  <Badge variant="secondary" className="mb-4">Launch Partner</Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    "EquipQR has revolutionized how we manage our equipment fleet. The QR code integration saves our technicians hours every day, and the cross-organizational team features let us collaborate seamlessly with our partners."
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground">Field adoption rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">50%</div>
                  <div className="text-sm text-muted-foreground">Faster work orders</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Card */}
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Industry Leading
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Built with feedback from equipment professionals and field-tested in demanding environments.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">SOC 2 Type II Compliant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">99.9% Uptime SLA</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">24/7 Enterprise Support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">Equipment Assets Tracked</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Work Orders Processed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Team Members Active</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">99.9%</div>
            <div className="text-sm text-muted-foreground">System Reliability</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;