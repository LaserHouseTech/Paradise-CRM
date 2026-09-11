import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LockScreen } from './components/auth/LockScreen';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickActionModal } from './components/common/QuickActionModal';
import { AttentionModal } from './components/common/AttentionModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientsView } from './components/crm/ClientsView';
import { PipelineView } from './components/crm/PipelineView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ReceivablesView } from './components/financial/ReceivablesView';
import { PayablesView } from './components/financial/PayablesView';
import { CashflowView } from './components/financial/CashflowView';
import { AccountsView } from './components/financial/AccountsView';
import { ReservesView } from './components/financial/ReservesView';
import { ProLaboreView } from './components/financial/ProLaboreView';
import { SubscriptionsView } from './components/recurrence/SubscriptionsView';
import { ForecastView } from './components/forecast/ForecastView';
import { MarketingView } from './components/marketing/MarketingView';
import { ReferralsView } from './components/referrals/ReferralsView';
import { GoalsView } from './components/goals/GoalsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { currentView, isLocked, toggleSidebarCollapse } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for Search, Cmd+B / Ctrl+B for Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebarCollapse]);

  // Close mobile sidebar when view changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentView]);

  if (isLocked) {
    return <LockScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'clients':
      case 'crm-clients':
        return <ClientsView />;
      case 'pipeline':
      case 'crm-pipeline':
        return <PipelineView />;
      case 'projects':
        return <ProjectsView />;
      case 'receivables':
      case 'financial-receivables':
        return <ReceivablesView />;
      case 'payables':
      case 'financial-payables':
        return <PayablesView />;
      case 'cashflow':
      case 'financial-cashflow':
        return <CashflowView />;
      case 'accounts':
      case 'financial-accounts':
        return <AccountsView />;
      case 'reserves':
      case 'financial-reserves':
        return <ReservesView />;
      case 'pro-labore':
      case 'prolabore':
      case 'financial-prolabore':
        return <ProLaboreView />;
      case 'subscriptions':
      case 'recurrence':
        return <SubscriptionsView />;
      case 'forecast':
        return <ForecastView />;
      case 'marketing':
        return <MarketingView />;
      case 'referrals':
        return <ReferralsView />;
      case 'goals':
        return <GoalsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="relative flex h-screen bg-[#06070a] text-neutral-200 overflow-hidden font-sans select-none antialiased">
      {/* Deep Space Cosmic Ambient Lighting & Star Dust Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Deep Sapphire space dust glow top left */}
        <div className="absolute -top-[25%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/[0.07] blur-[140px] animate-nebula" />
        {/* Celestial indigo nebula center right */}
        <div className="absolute top-[25%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/[0.05] blur-[160px]" />
        {/* Deep violet cosmic aura bottom center */}
        <div className="absolute -bottom-[20%] left-[25%] w-[65vw] h-[65vw] rounded-full bg-violet-900/[0.06] blur-[180px]" />
        {/* Fine celestial stardust grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Sidebar: Desktop + Mobile Drawer */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          onOpenAlertsModal={() => setIsAlertsOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QuickActionModal isOpen={isQuickActionOpen} onClose={() => setIsQuickActionOpen(false)} />
      <AttentionModal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
