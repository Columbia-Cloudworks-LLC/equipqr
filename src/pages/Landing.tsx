import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import CTASection from '@/components/landing/CTASection';
import LegalFooter from '@/components/layout/LegalFooter';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection id="features" />
        <div id="pricing">
          <SocialProofSection />
        </div>
        <div id="about">
          <CTASection />
        </div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default Landing;