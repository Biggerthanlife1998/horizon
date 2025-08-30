import { useState } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { User as UserType } from '@/types';
import LogoutModal from './LogoutModal';

interface TopbarProps {
  user?: UserType | null;
  onMenuToggle: () => void;
  onLogout: () => void;
}

export default function Topbar({ user, onMenuToggle, onLogout }: TopbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer for mobile */}
        <div className="lg:hidden" />

        {/* User section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-primary-600" />
                )}
              </div>
              
              {/* User name */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || 'guest@example.com'}
                </p>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg mx-2"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout}
      />
    </header>
  );
}
