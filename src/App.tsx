import React, { useState, useEffect } from 'react';
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
  const { currentView, isLocked } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="flex h-screen bg-[#0d0e11] text-neutral-200 overflow-hidden font-sans select-none antialiased">
      {/* Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenGlobalSearch={() => setIsSearchOpen(true)}
          onOpenAlertsModal={() => setIsAlertsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">{renderView()}</div>
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
