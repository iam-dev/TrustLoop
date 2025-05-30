import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Shield, Zap, ArrowRight, Check } from 'lucide-react';
import Button from '../components/ui/Button';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-white bg-opacity-20 text-white rounded-full px-3 py-1 text-sm font-medium mb-6">
            <Zap size={16} className="mr-1" />
            Powered by Algorand Blockchain
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto">
            Complete Tasks, Earn Verified On-Chain Rewards
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            TrustLoop verifies your actions and rewards you with blockchain-based tokens and NFTs.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight size={18} />}
              className="bg-white text-primary-700 hover:bg-opacity-90"
            >
              Start Earning
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:bg-opacity-10"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How TrustLoop Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-primary-600" />}
              title="Connect Wallet" 
              description="Securely connect your Algorand wallet to create your identity on TrustLoop."
            />
            
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-primary-600" />}
              title="Complete Tasks" 
              description="Watch videos, create memes, or complete tutorials to earn rewards."
            />
            
            <FeatureCard 
              icon={<Award className="h-8 w-8 text-primary-600" />}
              title="Earn Rewards" 
              description="Get instant on-chain verification and rewards for your completed tasks."
            />
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-surface-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Why Choose TrustLoop?</h2>
              
              <div className="space-y-4">
                <BenefitItem text="Verifiable proof of your actions on the blockchain" />
                <BenefitItem text="Earn real value through Algorand tokens and NFTs" />
                <BenefitItem text="Personalized video and voice guidance" />
                <BenefitItem text="Fun, gamified experience with leaderboards" />
                <BenefitItem text="Premium subscription for exclusive rewards" />
              </div>
              
              <Button 
                className="mt-8" 
                size="lg"
                onClick={() => navigate('/dashboard')}
              >
                Get Started Now
              </Button>
            </div>
            
            <div className="md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.pexels.com/photos/7567439/pexels-photo-7567439.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Earning rewards" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-2">Ready to start earning?</h3>
                    <p>Connect your wallet and complete your first task today.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Your Blockchain Rewards Journey</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of users already earning rewards through verified actions.
          </p>
          
          <Button 
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="bg-white text-primary-700 hover:bg-opacity-90"
          >
            Launch App
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-surface-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Award className="h-8 w-8 text-primary-400 mr-2" />
              <span className="text-2xl font-bold">TrustLoop</span>
            </div>
            
            <div className="flex space-x-6">
              <FooterLink href="#">Terms</FooterLink>
              <FooterLink href="#">Privacy</FooterLink>
              <FooterLink href="#">Support</FooterLink>
              <FooterLink href="#">About</FooterLink>
            </div>
          </div>
          
          <div className="border-t border-surface-700 mt-8 pt-8 text-center text-surface-400">
            © {new Date().getFullYear()} TrustLoop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-surface-50 rounded-xl p-8 text-center transition-all duration-300 hover:shadow-lg">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-surface-600">{description}</p>
    </div>
  );
};

interface BenefitItemProps {
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ text }) => {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
        <Check className="h-4 w-4 text-primary-700" />
      </div>
      <p className="ml-3 text-lg">{text}</p>
    </div>
  );
};

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children }) => {
  return (
    <a 
      href={href} 
      className="text-surface-300 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
};

export default Landing;