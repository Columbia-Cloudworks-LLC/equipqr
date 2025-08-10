import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="py-24 bg-primary/5">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Equipment Management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join industry leaders who trust EquipQR for their mission-critical equipment operations. 
            Start your free trial today or schedule a personalized demo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/support">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
              </Link>
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>✓ No credit card required for trial</p>
            <p>✓ Full feature access for 30 days</p>
            <p>✓ Expert onboarding and support</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;