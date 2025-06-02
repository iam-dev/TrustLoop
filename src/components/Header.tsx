import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Award, 
  Users, 
  Crown, 
  Store,
  User
} from 'lucide-react';
import WalletConnect from './WalletConnect';
import Button from './ui/Button';
import { cn } from '../lib/utils';

interface HeaderProps {
  address?: string;
  isConnected: boolean;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({
  address,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <header className="bg-white border-b border-surface-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-primary-700 flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900">TrustLoop</span>
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex ml-8">
            <NavLink to="/dashboard">
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to={isConnected ? "/marketplace" : "#"} 
              onClick={!isConnected ? () => alert("Please connect your wallet to access the Marketplace") : undefined}
              className={!isConnected ? "opacity-70 cursor-not-allowed" : ""}
            >
              <Store size={16} />
              <span>Marketplace</span>
              {!isConnected && <span className="ml-1 text-xs text-surface-500">(🔒)</span>}
            </NavLink>
            <NavLink to={isConnected ? "/rewards" : "#"}
              onClick={!isConnected ? () => alert("Please connect your wallet to access Rewards") : undefined}
              className={!isConnected ? "opacity-70 cursor-not-allowed" : ""}
            >
              <Award size={16} />
              <span>Rewards</span>
              {!isConnected && <span className="ml-1 text-xs text-surface-500">(🔒)</span>}
            </NavLink>
            <NavLink to="/leaderboard">
              <Users size={16} />
              <span>Leaderboard</span>
            </NavLink>
            {isConnected && (
              <NavLink to="/profile">
                <User size={16} />
                <span>Profile</span>
              </NavLink>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<Crown className="text-warning-500" size={16} />}
            className="hidden sm:flex"
          >
            Upgrade to Premium
          </Button>
          
          <WalletConnect
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            connected={isConnected}
            address={address}
          />
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, className, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-surface-600 hover:text-primary-700 hover:bg-surface-50',
        className
      )}
    >
      {children}
    </Link>
  );
};

export default Header;