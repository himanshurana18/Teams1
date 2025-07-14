import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  Home,
  Calendar,
  Users,
  MessageSquare,
  DollarSign,
  CheckSquare,
  Settings,
  User,
  CreditCard,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Payment', href: '/payment', icon: CreditCard },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();

  if (!open) return null;

  return (
    <div className="relative z-50 lg:hidden">
      <div className="fixed inset-0 bg-gray-900/80" onClick={() => setOpen(false)} />

      <div className="fixed inset-0 flex">
        <div className="relative mr-16 flex w-full max-w-xs flex-1">
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              className="-m-2.5 p-2.5"
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">TeamManager</span>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              isActive
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                              'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                            )}
                          >
                            <item.icon
                              className={cn(
                                isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                                'h-6 w-6 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;