import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Map,
  AlertTriangle,
  BarChart3,
  Briefcase,
  MapPin,
  Settings, 
  Menu, 
  X,
  Radio,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/team', icon: Users, label: 'Team Members' },
  { path: '/map', icon: Map, label: 'Live Map' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs/WO' },
  { path: '/geofences', icon: MapPin, label: 'Geofences' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col proscan-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
        data-testid="desktop-sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--accent-primary)] flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-bold text-lg tracking-tight font-['Cabinet_Grotesk']">
                ProScan
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 bg-[var(--accent-primary)] flex items-center justify-center mx-auto">
              <Radio className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\//g, '-')}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive 
                      ? "bg-[var(--accent-primary)] text-white" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 text-[var(--text-secondary)]"
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <header className="proscan-header h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--accent-primary)] flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-base tracking-tight font-['Cabinet_Grotesk']">
              Digital ProScan
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            )}
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-[var(--border-subtle)] shadow-lg animate-slide-up max-h-[calc(100vh-56px)] overflow-y-auto">
            <nav className="py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\//g, '-')}`}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium",
                    isActive 
                      ? "bg-[var(--accent-primary)] text-white" 
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
