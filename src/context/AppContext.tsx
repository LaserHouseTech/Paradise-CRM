import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  SystemData,
  Client,
  Project,
  Subscription,
  Receivable,
  Payable,
  FinancialAccount,
  InternalTransfer,
  FinancialReserve,
  ProLaboreWithdrawal,
  Referral,
  MarketingCampaign,
  CustomCategory,
  BusinessGoals,
  CompanySettings,
  PeriodFilter,
  PipelineStage,
} from '../types';
import { initialSystemData } from '../data/initialData';
import { supabaseSyncService } from '../services/supabaseSyncService';

interface AppContextType {
  data: SystemData;
  period: PeriodFilter;
  customDateRange: { start: string; end: string };
  currentView: string;
  selectedClientId: string | null;
  isLocked: boolean;
  isSidebarCollapsed: boolean;
  setPeriod: (p: PeriodFilter) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setCurrentView: (v: string) => void;
  setSelectedClientId: (id: string | null) => void;
  setIsLocked: (locked: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebarCollapse: () => void;
  verifyLockPin: (pin: string) => boolean;

  // Supabase Live Auto-Sync
  supabaseSyncState: 'idle' | 'syncing' | 'synced' | 'error';
  lastSupabaseSyncTime: Date | null;
  supabaseSyncMessage: string | null;
  isSupabaseAutoSyncEnabled: boolean;
  setIsSupabaseAutoSyncEnabled: (enabled: boolean) => void;
  forceSyncSupabase: () => Promise<void>;
  pullFromSupabase: () => Promise<boolean>;

  // Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  updatePipelineStage: (clientId: string, stage: PipelineStage) => void;
  updateClientPipelineStage?: (clientId: string, stage: PipelineStage) => void;

  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addSubscription: (sub: Omit<Subscription, 'id'>) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  updateSubscriptionStatus: (id: string, status: Subscription['status']) => void;
  cancelSubscription: (id: string, reason: string) => void;

  addReceivable: (rec: Omit<Receivable, 'id' | 'createdAt'>) => Receivable;
  markReceivableAsPaid: (id: string, accountId: string, paymentDate?: string, feeAmount?: number) => void;
  updateReceivable: (id: string, updates: Partial<Receivable>) => void;
  deleteReceivable: (id: string) => void;

  addPayable: (pay: Omit<Payable, 'id' | 'createdAt'>) => Payable;
  markPayableAsPaid: (id: string, accountId: string, paymentDate?: string) => void;
  updatePayable: (id: string, updates: Partial<Payable>) => void;
  deletePayable: (id: string) => void;

  createInfinitePaySale: (params: {
    clientId: string;
    projectId?: string;
    description: string;
    grossAmount: number;
    feeAmount: number;
    installmentsCount: number;
    saleDate: string;
    firstDueDate: string;
    category: string;
  }) => void;

  createSiteAndCarePlanBundle: (params: {
    client: Omit<Client, 'id' | 'createdAt'> | { id: string };
    projectName: string;
    projectValue: number; // default R$ 697
    monthlyPlanValue: number; // default R$ 197
    dueDay: number;
    paymentMethod: string;
    paidNow: boolean;
    accountId?: string;
  }) => void;

  executeTransfer: (fromAccountId: string, toAccountId: string, amount: number, description?: string) => void;
  addFinancialAccount: (acc: Omit<FinancialAccount, 'id'>) => void;
  updateFinancialAccount: (id: string, updates: Partial<FinancialAccount>) => void;

  addReserve: (res: Omit<FinancialReserve, 'id'>) => void;
  updateReserve: (id: string, updates: Partial<FinancialReserve>) => void;
  adjustReserveAmount: (id: string, delta: number) => void;

  addProLabore: (withdrawal: Omit<ProLaboreWithdrawal, 'id'>) => void;
  addProLaboreWithdrawal: (withdrawal: Omit<ProLaboreWithdrawal, 'id'>) => void;
  updateProLabore: (id: string, updates: Partial<ProLaboreWithdrawal>) => void;

  addReferral: (ref: Omit<Referral, 'id'>) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  updateReferralStatus: (id: string, status: Referral['status'], paymentDate?: string) => void;

  addMarketingCampaign: (camp: Omit<MarketingCampaign, 'id'>) => void;
  updateMarketingCampaign: (id: string, updates: Partial<MarketingCampaign>) => void;

  addCategory: (name: string, type: 'receivable' | 'payable') => void;
  toggleCategoryStatus: (id: string) => void;

  updateGoals: (goals: Partial<BusinessGoals>) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;

  exportBackup: () => void;
  exportBackupJSON?: () => void;
  restoreBackup: (jsonData: SystemData) => boolean;
  importBackupJSON?: (jsonStr: string) => boolean;
  resetToInitialData: () => void;
  resetToDemoData?: () => void;
  clearDatabaseAndStartFresh: () => Promise<{ success: boolean; message: string }>;
  lockApp?: () => void;
  unlockApp?: () => void;
  exportCSV: (type: 'clients' | 'receivables' | 'payables' | 'subscriptions' | 'cashflow') => void;
}

const STORAGE_KEY = 'paradiso_crm_v3_production';
const LEGACY_STORAGE_KEYS = [
  'paradiso_crm_v2_clean',
  'paradiso_local_management_v1',
  'paradiso_crm_data',
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SystemData>(() => {
    try {
      // Discard legacy demo storage so client base and accounts start completely zeroed for real production
      if (typeof window !== 'undefined') {
        for (const oldKey of LEGACY_STORAGE_KEYS) {
          localStorage.removeItem(oldKey);
        }
      }

      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);

        // Normalize clients so pipelineStage is always defined
        const validStages: PipelineStage[] = [
          'Prospectado',
          'Demo em produção',
          'Demo pronta',
          'Demo apresentada',
          'Negociação',
          'Fechado',
          'Perdido',
        ];
        const normalizedClients: Client[] = (parsed.clients || []).map((c: any) => {
          let stage: PipelineStage = c.pipelineStage;
          if (!stage || !validStages.includes(stage)) {
            const raw = stage as string;
            if (raw === 'Primeiro contato' || raw === 'Respondeu' || raw === 'Qualificado') stage = 'Prospectado';
            else if (raw === 'Proposta enviada') stage = 'Negociação';
            else if (c.status === 'Lead') stage = 'Prospectado';
            else if (c.status === 'Em negociação' || c.status === 'Proposta enviada') stage = 'Negociação';
            else if (c.status === 'Perdido' || c.status === 'Cancelado') stage = 'Perdido';
            else if (c.status === 'Cliente ativo' || c.status === 'Cliente recorrente') stage = 'Fechado';
            else stage = 'Prospectado';
          }
          return {
            ...c,
            pipelineStage: stage,
          };
        });

        return {
          ...initialSystemData,
          ...parsed,
          clients: normalizedClients,
          settings: {
            ...initialSystemData.settings,
            ...parsed.settings,
            userAvatarUrl: parsed.settings?.userAvatarUrl || '/user_avatar.svg',
            ownerName: parsed.settings?.ownerName || 'Luís Santos (CEO)',
            userName: parsed.settings?.userName || 'Luís Santos (CEO)',
            userRole: parsed.settings?.userRole || 'CEO',
          },
          goals: {
            ...initialSystemData.goals,
            ...parsed.goals,
          },
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return initialSystemData;
  });

  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('paradiso_sidebar_collapsed') === 'true';
      }
    } catch {}
    return false;
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('paradiso_sidebar_collapsed', String(next));
        }
      } catch {}
      return next;
    });
  };

  // Supabase Auto-Sync State
  const [supabaseSyncState, setSupabaseSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSupabaseSyncTime, setLastSupabaseSyncTime] = useState<Date | null>(null);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);
  const [isSupabaseAutoSyncEnabled, setIsSupabaseAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('paradiso_supabase_autosync');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const isInitialMount = useRef(true);
  const isSyncingFromRemote = useRef(false);

  // Persist auto-sync setting in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('paradiso_supabase_autosync', String(isSupabaseAutoSyncEnabled));
    } catch {}
  }, [isSupabaseAutoSyncEnabled]);

  // Pull data from Supabase
  const pullFromSupabase = async (): Promise<boolean> => {
    setSupabaseSyncState('syncing');
    setSupabaseSyncMessage('Sincronizando com o Supabase...');
    try {
      isSyncingFromRemote.current = true;
      const res = await supabaseSyncService.pullDataFromSupabase();
      if (res.success && res.data) {
        setData(res.data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
        } catch {}
        setSupabaseSyncState('synced');
        setLastSupabaseSyncTime(new Date());
        setSupabaseSyncMessage(res.message);
        setTimeout(() => {
          isSyncingFromRemote.current = false;
        }, 800);
        return true;
      } else {
        // Fallback check status
        const status = await supabaseSyncService.checkStatus();
        if (status.connected) {
          setSupabaseSyncState('synced');
          setSupabaseSyncMessage(`Supabase online (${status.tablesFound.length} tabelas prontas)`);
        } else {
          setSupabaseSyncState('error');
          setSupabaseSyncMessage(res.message || 'Falha ao conectar com o Supabase');
        }
        setTimeout(() => {
          isSyncingFromRemote.current = false;
        }, 800);
        return false;
      }
    } catch (err: any) {
      setSupabaseSyncState('error');
      setSupabaseSyncMessage(err.message || 'Erro ao sincronizar com o Supabase');
      isSyncingFromRemote.current = false;
      return false;
    }
  };

  // Initial Supabase startup sync & realtime subscription
  useEffect(() => {
    // 1. Initial pull from Supabase immediately on mount
    pullFromSupabase();

    // 2. Subscribe to real-time changes on database tables
    const unsubscribe = supabaseSyncService.subscribeToRealtimeChanges(() => {
      // If we are not currently pushing or pulling, sync remote changes
      if (!isSyncingFromRemote.current) {
        pullFromSupabase();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error persisting state to localStorage:', e);
    }
  }, [data]);

  // Real-time automatic sync to Supabase on ANY data change (debounced 1000ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Do NOT push back if we are in the middle of pulling from remote
    if (isSyncingFromRemote.current) return;
    if (!isSupabaseAutoSyncEnabled) return;

    setSupabaseSyncState('syncing');
    setSupabaseSyncMessage('Salvando alterações no Supabase...');

    const timer = setTimeout(async () => {
      if (isSyncingFromRemote.current) return;
      try {
        const res = await supabaseSyncService.pushAllDataToSupabase(data);
        if (res.success) {
          setSupabaseSyncState('synced');
          setLastSupabaseSyncTime(new Date());
          setSupabaseSyncMessage(res.message);
        } else {
          setSupabaseSyncState('error');
          setSupabaseSyncMessage(res.message);
        }
      } catch (err: any) {
        setSupabaseSyncState('error');
        setSupabaseSyncMessage(err.message || 'Erro ao sincronizar com o Supabase');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, isSupabaseAutoSyncEnabled]);

  const forceSyncSupabase = async () => {
    setSupabaseSyncState('syncing');
    setSupabaseSyncMessage('Enviando dados para o Supabase...');
    try {
      // Push latest local state to Supabase directly
      const pushRes = await supabaseSyncService.pushAllDataToSupabase(data);
      if (pushRes.success) {
        setSupabaseSyncState('synced');
        setLastSupabaseSyncTime(new Date());
        setSupabaseSyncMessage(pushRes.message);
      } else {
        setSupabaseSyncState('error');
        setSupabaseSyncMessage(pushRes.message);
      }
    } catch (err: any) {
      setSupabaseSyncState('error');
      setSupabaseSyncMessage(err.message || 'Erro ao sincronizar com o Supabase');
    }
  };

  const addAuditLog = (action: string, details: string, entityType?: string, entityId?: string) => {
    const log = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details,
      entityType,
      entityId,
    };
    setData((prev) => ({
      ...prev,
      auditLogs: [log, ...prev.auditLogs.slice(0, 99)],
    }));
  };

  const verifyLockPin = (pin: string): boolean => {
    const currentPin = data.settings.lockPin || '1234';
    if (pin === currentPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  // CLIENTS
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    let pipelineStage = clientData.pipelineStage;
    if (!pipelineStage) {
      if (clientData.status === 'Lead') pipelineStage = 'Prospectado';
      else if (clientData.status === 'Em negociação' || clientData.status === 'Proposta enviada') pipelineStage = 'Negociação';
      else if (clientData.status === 'Perdido' || clientData.status === 'Cancelado') pipelineStage = 'Perdido';
      else if (clientData.status === 'Cliente ativo' || clientData.status === 'Cliente recorrente') pipelineStage = 'Fechado';
      else pipelineStage = 'Prospectado';
    }

    const newClient: Client = {
      ...clientData,
      pipelineStage,
      id: 'cli-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      totalSpent: clientData.totalSpent || 0,
    };
    setData((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));
    addAuditLog('Novo Cliente/Lead', `Cadastrado: ${newClient.companyName} (${newClient.status} - Etapa: ${newClient.pipelineStage})`, 'Client', newClient.id);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => {
        if (c.id !== id) return c;
        let pipelineStage = updates.pipelineStage ?? c.pipelineStage;
        if (!updates.pipelineStage && updates.status && updates.status !== c.status) {
          if (updates.status === 'Lead' && c.pipelineStage === 'Fechado') pipelineStage = 'Prospectado';
          else if (updates.status === 'Em negociação' || updates.status === 'Proposta enviada') pipelineStage = 'Negociação';
          else if (updates.status === 'Cliente ativo' || updates.status === 'Cliente recorrente') pipelineStage = 'Fechado';
          else if (updates.status === 'Perdido' || updates.status === 'Cancelado') pipelineStage = 'Perdido';
        }
        if (!pipelineStage) {
          pipelineStage = 'Prospectado';
        }
        return { ...c, ...updates, pipelineStage };
      }),
    }));
    addAuditLog('Cliente Atualizado', `Cliente ID ${id} dados atualizados.`, 'Client', id);
  };

  const deleteClient = (id: string) => {
    const client = data.clients.find((c) => c.id === id);
    if (!client) return;

    const removedProjects = data.projects.filter((p) => p.clientId === id);
    const removedSubs = data.subscriptions.filter((s) => s.clientId === id);
    const removedRecs = data.receivables.filter((r) => r.clientId === id);
    const removedRefs = data.referrals.filter((ref) => ref.referredClientId === id);

    setData((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
      projects: prev.projects.filter((p) => p.clientId !== id),
      subscriptions: prev.subscriptions.filter((s) => s.clientId !== id),
      receivables: prev.receivables.filter((r) => r.clientId !== id),
      referrals: prev.referrals.filter((ref) => ref.referredClientId !== id),
    }));

    if (selectedClientId === id) {
      setSelectedClientId(null);
    }

    const details = `Cliente "${client.companyName}" e tudo relacionado foram excluídos com sucesso. Removidos: ${removedProjects.length} projeto(s), ${removedSubs.length} assinatura(s), ${removedRecs.length} cobrança(s)/recebível(is).`;
    addAuditLog('Cliente e Registros Excluídos', details, 'Client', id);

    // Sync deletion to Supabase
    supabaseSyncService.deleteClient(id).catch(() => {});
  };

  const updatePipelineStage = (clientId: string, stage: PipelineStage) => {
    const client = data.clients.find((c) => c.id === clientId);
    let newStatus = client?.status || 'Lead';
    if (stage === 'Fechado') {
      newStatus = 'Cliente ativo';
    } else if (stage === 'Perdido') {
      newStatus = 'Perdido';
    } else if (stage === 'Negociação') {
      newStatus = 'Em negociação';
    } else {
      if (client?.status === 'Perdido' || client?.status === 'Cancelado') {
        newStatus = 'Lead';
      }
    }

    const updatedClient = client ? { ...client, pipelineStage: stage, status: newStatus } : null;

    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) =>
        c.id === clientId ? { ...c, pipelineStage: stage, status: newStatus } : c
      ),
    }));
    addAuditLog('Pipeline Atualizado', `Lead ${client?.companyName || clientId} movido para "${stage}".`, 'Client', clientId);

    // Save stage immediately to Supabase
    if (updatedClient) {
      supabaseSyncService.syncClientStage(updatedClient, stage).catch((err) => {
        console.warn('Erro ao sincronizar estágio do pipeline no Supabase:', err);
      });
    }
  };

  // PROJECTS
  const addProject = (projectData: Omit<Project, 'id'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: 'prj-' + Date.now(),
    };
    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    addAuditLog('Novo Projeto', `Projeto "${newProject.name}" criado para cliente. Valor: R$ ${newProject.contractValue}.`, 'Project', newProject.id);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    addAuditLog('Projeto Atualizado', `Projeto ID ${id} atualizado.`, 'Project', id);
  };

  const deleteProject = (id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
    addAuditLog('Projeto Removido', `Projeto ID ${id} removido.`, 'Project', id);
  };

  // SUBSCRIPTIONS (PLANO DE CUIDADO DIGITAL)
  const addSubscription = (subData: Omit<Subscription, 'id'>): Subscription => {
    const newSub: Subscription = {
      ...subData,
      id: 'sub-' + Date.now(),
    };
    setData((prev) => {
      // Mark client as recurring
      const updatedClients = prev.clients.map((c) =>
        c.id === subData.clientId ? { ...c, isRecurring: true, status: 'Cliente recorrente' as const } : c
      );
      return {
        ...prev,
        subscriptions: [newSub, ...prev.subscriptions],
        clients: updatedClients,
      };
    });
    addAuditLog('Nova Assinatura', `Plano de Cuidado Digital ativado para cliente ID ${subData.clientId} (R$ ${subData.monthlyValue}/mês).`, 'Subscription', newSub.id);
    return newSub;
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    addAuditLog('Assinatura Atualizada', `Plano recorrente ID ${id} atualizado.`, 'Subscription', id);
  };

  const updateSubscriptionStatus = (id: string, status: Subscription['status']) => {
    updateSubscription(id, { status });
  };

  const cancelSubscription = (id: string, reason: string) => {
    setData((prev) => {
      const sub = prev.subscriptions.find((s) => s.id === id);
      const updatedSubs = prev.subscriptions.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'Cancelado' as const,
              cancelledAt: new Date().toISOString().split('T')[0],
              cancellationReason: reason,
            }
          : s
      );

      // Check if client has other active subscriptions
      const otherActive = updatedSubs.some((s) => s.clientId === sub?.clientId && s.status === 'Ativo');
      const updatedClients = prev.clients.map((c) =>
        c.id === sub?.clientId && !otherActive ? { ...c, isRecurring: false, status: 'Cliente inativo' as const } : c
      );

      return {
        ...prev,
        subscriptions: updatedSubs,
        clients: updatedClients,
      };
    });
    addAuditLog('Assinatura Cancelada', `Plano cancelado: ${reason}`, 'Subscription', id);
  };

  // RECEIVABLES
  const addReceivable = (recData: Omit<Receivable, 'id' | 'createdAt'>): Receivable => {
    const newRec: Receivable = {
      ...recData,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString().split('T')[0],
      feeAmount: recData.feeAmount || 0,
      netAmount: recData.netAmount !== undefined ? recData.netAmount : recData.grossAmount - (recData.feeAmount || 0),
    };

    setData((prev) => {
      // If paid immediately and account specified, update account balance
      let updatedAccounts = prev.financialAccounts;
      if (newRec.status === 'Pago' && newRec.accountId) {
        updatedAccounts = prev.financialAccounts.map((a) =>
          a.id === newRec.accountId ? { ...a, balance: a.balance + newRec.netAmount } : a
        );
      }

      return {
        ...prev,
        receivables: [newRec, ...prev.receivables],
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog('Recebimento Criado', `Fatura criada: ${newRec.description} - R$ ${newRec.grossAmount}`, 'Receivable', newRec.id);
    return newRec;
  };

  const markReceivableAsPaid = (
    id: string,
    accountId: string,
    paymentDate?: string,
    feeAmount?: number
  ) => {
    setData((prev) => {
      const rec = prev.receivables.find((r) => r.id === id);
      if (!rec) return prev;

      const pDate = paymentDate || new Date().toISOString().split('T')[0];
      const actualFee = feeAmount !== undefined ? feeAmount : rec.feeAmount || 0;
      const actualNet = rec.grossAmount - actualFee;

      const updatedReceivables = prev.receivables.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Pago' as const,
              paymentDate: pDate,
              accountId,
              feeAmount: actualFee,
              netAmount: actualNet,
            }
          : r
      );

      // Increase financial account balance by NET amount (Valor líquido)
      const updatedAccounts = prev.financialAccounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance + actualNet } : a
      );

      // Also update project paidAmount if linked
      let updatedProjects = prev.projects;
      if (rec.projectId) {
        updatedProjects = prev.projects.map((p) =>
          p.id === rec.projectId ? { ...p, paidAmount: (p.paidAmount || 0) + rec.grossAmount } : p
        );
      }

      // Also update client totalSpent
      const updatedClients = prev.clients.map((c) =>
        c.id === rec.clientId ? { ...c, totalSpent: (c.totalSpent || 0) + rec.grossAmount } : c
      );

      // If subscription payment, update nextDueDate and clear 'Em atraso' status
      let updatedSubs = prev.subscriptions;
      if (rec.subscriptionId) {
        updatedSubs = prev.subscriptions.map((s) => {
          if (s.id === rec.subscriptionId) {
            const nextMonth = new Date(s.nextDueDate || pDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return {
              ...s,
              status: 'Ativo' as const,
              nextDueDate: nextMonth.toISOString().split('T')[0],
            };
          }
          return s;
        });
      }

      return {
        ...prev,
        receivables: updatedReceivables,
        financialAccounts: updatedAccounts,
        projects: updatedProjects,
        clients: updatedClients,
        subscriptions: updatedSubs,
      };
    });

    addAuditLog('Recebimento Liquidado', `Recebimento ID ${id} marcado como pago e creditado em conta.`, 'Receivable', id);
  };

  const updateReceivable = (id: string, updates: Partial<Receivable>) => {
    setData((prev) => {
      const oldRec = prev.receivables.find((r) => r.id === id);
      if (!oldRec) return prev;
      const updatedRec = { ...oldRec, ...updates };

      let updatedAccounts = prev.financialAccounts;
      let updatedClients = prev.clients;

      // Handle balance adjustments if status changed between Pago and Pendente
      const wasPaid = oldRec.status === 'Pago';
      const isNowPaid = updatedRec.status === 'Pago';
      const oldNet = oldRec.netAmount || oldRec.grossAmount;
      const newNet = updatedRec.netAmount || updatedRec.grossAmount;

      if (!wasPaid && isNowPaid && updatedRec.accountId) {
        // Credit account
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === updatedRec.accountId ? { ...a, balance: a.balance + newNet } : a
        );
        // Add to client totalSpent
        updatedClients = updatedClients.map((c) =>
          c.id === updatedRec.clientId ? { ...c, totalSpent: (c.totalSpent || 0) + updatedRec.grossAmount } : c
        );
      } else if (wasPaid && !isNowPaid && oldRec.accountId) {
        // Reverse account credit
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === oldRec.accountId ? { ...a, balance: a.balance - oldNet } : a
        );
        // Remove from client totalSpent
        updatedClients = updatedClients.map((c) =>
          c.id === oldRec.clientId ? { ...c, totalSpent: Math.max(0, (c.totalSpent || 0) - oldRec.grossAmount) } : c
        );
      } else if (wasPaid && isNowPaid) {
        // Value adjusted while paid
        const netDiff = newNet - oldNet;
        const grossDiff = updatedRec.grossAmount - oldRec.grossAmount;
        if (oldRec.accountId === updatedRec.accountId) {
          if (netDiff !== 0 && updatedRec.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === updatedRec.accountId ? { ...a, balance: a.balance + netDiff } : a
            );
          }
        } else {
          // Changed account
          if (oldRec.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === oldRec.accountId ? { ...a, balance: a.balance - oldNet } : a
            );
          }
          if (updatedRec.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === updatedRec.accountId ? { ...a, balance: a.balance + newNet } : a
            );
          }
        }
        if (grossDiff !== 0) {
          updatedClients = updatedClients.map((c) =>
            c.id === updatedRec.clientId ? { ...c, totalSpent: Math.max(0, (c.totalSpent || 0) + grossDiff) } : c
          );
        }
      }

      return {
        ...prev,
        receivables: prev.receivables.map((r) => (r.id === id ? updatedRec : r)),
        financialAccounts: updatedAccounts,
        clients: updatedClients,
      };
    });
    addAuditLog('Recebimento Atualizado', `Recebimento ID ${id} atualizado.`, 'Receivable', id);
  };

  const deleteReceivable = (id: string) => {
    // Delete immediately from Supabase to prevent resurrection on background sync
    void supabaseSyncService.deleteReceivable(id);

    setData((prev) => {
      const oldRec = prev.receivables.find((r) => r.id === id);
      let updatedAccounts = prev.financialAccounts;
      let updatedClients = prev.clients;

      if (oldRec && oldRec.status === 'Pago') {
        const net = oldRec.netAmount || oldRec.grossAmount;
        if (oldRec.accountId) {
          updatedAccounts = updatedAccounts.map((a) =>
            a.id === oldRec.accountId ? { ...a, balance: a.balance - net } : a
          );
        }
        updatedClients = updatedClients.map((c) =>
          c.id === oldRec.clientId ? { ...c, totalSpent: Math.max(0, (c.totalSpent || 0) - oldRec.grossAmount) } : c
        );
      }

      return {
        ...prev,
        receivables: prev.receivables.filter((r) => r.id !== id),
        financialAccounts: updatedAccounts,
        clients: updatedClients,
      };
    });
    addAuditLog('Recebimento Excluído', `Recebimento ID ${id} excluído e fluxo de caixa recalculado.`, 'Receivable', id);
  };

  // PAYABLES (DESPESAS)
  const addPayable = (payData: Omit<Payable, 'id' | 'createdAt'>): Payable => {
    const newPay: Payable = {
      ...payData,
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setData((prev) => {
      let updatedAccounts = prev.financialAccounts;
      if (newPay.status === 'Pago' && newPay.accountId) {
        updatedAccounts = prev.financialAccounts.map((a) =>
          a.id === newPay.accountId ? { ...a, balance: a.balance - newPay.amount } : a
        );
      }
      return {
        ...prev,
        payables: [newPay, ...prev.payables],
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog('Despesa Criada', `Conta a pagar: ${newPay.description} (R$ ${newPay.amount})`, 'Payable', newPay.id);
    return newPay;
  };

  const markPayableAsPaid = (id: string, accountId: string, paymentDate?: string) => {
    setData((prev) => {
      const pay = prev.payables.find((p) => p.id === id);
      if (!pay) return prev;

      const pDate = paymentDate || new Date().toISOString().split('T')[0];

      const updatedPayables = prev.payables.map((p) =>
        p.id === id ? { ...p, status: 'Pago' as const, paymentDate: pDate, accountId } : p
      );

      // Deduct from account balance
      const updatedAccounts = prev.financialAccounts.map((a) =>
        a.id === accountId ? { ...a, balance: a.balance - pay.amount } : a
      );

      return {
        ...prev,
        payables: updatedPayables,
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog('Despesa Paga', `Despesa ID ${id} liquidada e debitada da conta.`, 'Payable', id);
  };

  const updatePayable = (id: string, updates: Partial<Payable>) => {
    setData((prev) => {
      const oldPay = prev.payables.find((p) => p.id === id);
      if (!oldPay) return prev;
      const updatedPay = { ...oldPay, ...updates };

      let updatedAccounts = prev.financialAccounts;
      const wasPaid = oldPay.status === 'Pago';
      const isNowPaid = updatedPay.status === 'Pago';

      if (!wasPaid && isNowPaid && updatedPay.accountId) {
        // Deduct from account
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === updatedPay.accountId ? { ...a, balance: a.balance - updatedPay.amount } : a
        );
      } else if (wasPaid && !isNowPaid && oldPay.accountId) {
        // Revert deduction
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === oldPay.accountId ? { ...a, balance: a.balance + oldPay.amount } : a
        );
      } else if (wasPaid && isNowPaid) {
        const diff = updatedPay.amount - oldPay.amount;
        if (oldPay.accountId === updatedPay.accountId) {
          if (diff !== 0 && updatedPay.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === updatedPay.accountId ? { ...a, balance: a.balance - diff } : a
            );
          }
        } else {
          if (oldPay.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === oldPay.accountId ? { ...a, balance: a.balance + oldPay.amount } : a
            );
          }
          if (updatedPay.accountId) {
            updatedAccounts = updatedAccounts.map((a) =>
              a.id === updatedPay.accountId ? { ...a, balance: a.balance - updatedPay.amount } : a
            );
          }
        }
      }

      return {
        ...prev,
        payables: prev.payables.map((p) => (p.id === id ? updatedPay : p)),
        financialAccounts: updatedAccounts,
      };
    });
    addAuditLog('Despesa Atualizada', `Despesa ID ${id} atualizada.`, 'Payable', id);
  };

  const deletePayable = (id: string) => {
    // Delete immediately from Supabase to prevent resurrection on background sync
    void supabaseSyncService.deletePayable(id);

    setData((prev) => {
      const oldPay = prev.payables.find((p) => p.id === id);
      let updatedAccounts = prev.financialAccounts;
      if (oldPay && oldPay.status === 'Pago' && oldPay.accountId) {
        updatedAccounts = updatedAccounts.map((a) =>
          a.id === oldPay.accountId ? { ...a, balance: a.balance + oldPay.amount } : a
        );
      }
      return {
        ...prev,
        payables: prev.payables.filter((p) => p.id !== id),
        financialAccounts: updatedAccounts,
      };
    });
    addAuditLog('Despesa Excluída', `Despesa ID ${id} excluída e fluxo de caixa recalculado.`, 'Payable', id);
  };

  // INFINITEPAY MANUAL REGISTRATION
  const createInfinitePaySale = (params: {
    clientId: string;
    projectId?: string;
    description: string;
    grossAmount: number;
    feeAmount: number;
    installmentsCount: number;
    saleDate: string;
    firstDueDate: string;
    category: string;
  }) => {
    const installments = Math.max(1, params.installmentsCount);
    const grossPerInstallment = +(params.grossAmount / installments).toFixed(2);
    const feePerInstallment = +(params.feeAmount / installments).toFixed(2);
    const netPerInstallment = grossPerInstallment - feePerInstallment;

    const baseDueDate = new Date(params.firstDueDate);
    const newReceivables: Receivable[] = [];

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(baseDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const rec: Receivable = {
        id: 'rec-inf-' + Date.now() + '-' + i,
        clientId: params.clientId,
        projectId: params.projectId,
        description: `${params.description} (Parcela ${i}/${installments})`,
        category: params.category || 'Sites',
        grossAmount: grossPerInstallment,
        feeAmount: feePerInstallment,
        netAmount: netPerInstallment,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentMethod: 'InfinitePay',
        status: 'Pendente',
        installmentNumber: i,
        totalInstallments: installments,
        createdAt: params.saleDate || new Date().toISOString().split('T')[0],
        notes: `Venda InfinitePay. Taxa total aplicada: R$ ${params.feeAmount.toFixed(2)}`,
      };
      newReceivables.push(rec);
    }

    setData((prev) => ({
      ...prev,
      receivables: [...newReceivables, ...prev.receivables],
    }));

    addAuditLog(
      'Venda InfinitePay Registrada',
      `${params.description}: R$ ${params.grossAmount} em ${installments}x (Taxa: R$ ${params.feeAmount}, Líquido: R$ ${(params.grossAmount - params.feeAmount).toFixed(2)})`,
      'Receivable'
    );
  };

  // SITE + PLANO BUNDLE RULE
  const createSiteAndCarePlanBundle = (params: {
    client: Omit<Client, 'id' | 'createdAt'> | { id: string };
    projectName: string;
    projectValue: number; // R$ 697
    monthlyPlanValue: number; // R$ 197
    dueDay: number;
    paymentMethod: string;
    paidNow: boolean;
    accountId?: string;
  }) => {
    let clientId: string;
    let clientName = '';

    if ('id' in params.client) {
      clientId = params.client.id;
      clientName = data.clients.find((c) => c.id === clientId)?.companyName || 'Cliente';
    } else {
      const created = addClient({
        ...params.client,
        isRecurring: true,
        status: 'Cliente recorrente',
      });
      clientId = created.id;
      clientName = created.companyName;
    }

    // 1. Create Project
    const project: Project = {
      id: 'prj-' + Date.now(),
      name: params.projectName || `Site + Plano - ${clientName}`,
      clientId,
      serviceId: 'srv-2',
      serviceName: 'Site + Plano de Cuidado Digital',
      contractValue: params.projectValue,
      contractDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Em desenvolvimento',
      paymentMethod: params.paymentMethod,
      installments: 1,
      paidAmount: params.paidNow ? params.projectValue : 0,
      hasCarePlan: true,
      notes: `Projeto vinculado ao Plano de Cuidado Digital mensal de R$ ${params.monthlyPlanValue}.`,
    };

    // 2. Create Project Receivable
    const projectRec: Receivable = {
      id: 'rec-' + Date.now() + '-prj',
      clientId,
      projectId: project.id,
      description: `Projeto ${project.name}`,
      category: 'Sites',
      grossAmount: params.projectValue,
      feeAmount: 0,
      netAmount: params.projectValue,
      dueDate: new Date().toISOString().split('T')[0],
      paymentDate: params.paidNow ? new Date().toISOString().split('T')[0] : undefined,
      paymentMethod: params.paymentMethod as any,
      accountId: params.paidNow ? params.accountId : undefined,
      status: params.paidNow ? 'Pago' : 'Pendente',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 3. Create Subscription (Plano de Cuidado)
    const nextDue = new Date();
    nextDue.setDate(params.dueDay || 10);
    if (nextDue <= new Date()) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }

    const subscription: Subscription = {
      id: 'sub-' + Date.now(),
      clientId,
      planName: 'Plano de Cuidado Digital',
      monthlyValue: params.monthlyPlanValue,
      startDate: new Date().toISOString().split('T')[0],
      dueDay: params.dueDay || 10,
      nextDueDate: nextDue.toISOString().split('T')[0],
      status: 'Ativo',
      minimumTermMonths: 6,
      notes: `Iniciado junto com o projeto ${project.name}.`,
    };

    setData((prev) => {
      let updatedAccounts = prev.financialAccounts;
      if (params.paidNow && params.accountId) {
        updatedAccounts = prev.financialAccounts.map((a) =>
          a.id === params.accountId ? { ...a, balance: a.balance + params.projectValue } : a
        );
      }

      return {
        ...prev,
        projects: [project, ...prev.projects],
        receivables: [projectRec, ...prev.receivables],
        subscriptions: [subscription, ...prev.subscriptions],
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog(
      'Site + Plano Contratado',
      `Combo Site (R$ ${params.projectValue}) + Plano de Cuidado Digital (R$ ${params.monthlyPlanValue}/mês) registrado para ${clientName}.`,
      'Project',
      project.id
    );
  };

  // INTERNAL TRANSFERS (NO REVENUE OR EXPENSE!)
  const executeTransfer = (fromAccountId: string, toAccountId: string, amount: number, description?: string) => {
    if (fromAccountId === toAccountId) return;
    const transfer: InternalTransfer = {
      id: 'trf-' + Date.now(),
      fromAccountId,
      toAccountId,
      amount,
      date: new Date().toISOString().split('T')[0],
      description: description || 'Transferência interna de fundos',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => {
      const fromAcc = prev.financialAccounts.find((a) => a.id === fromAccountId);
      const toAcc = prev.financialAccounts.find((a) => a.id === toAccountId);

      const updatedAccounts = prev.financialAccounts.map((a) => {
        if (a.id === fromAccountId) return { ...a, balance: a.balance - amount };
        if (a.id === toAccountId) return { ...a, balance: a.balance + amount };
        return a;
      });

      return {
        ...prev,
        transfers: [transfer, ...prev.transfers],
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog(
      'Transferência Interna',
      `R$ ${amount} transferido internamente. Não afeta Faturamento ou Lucro.`,
      'Transfer',
      transfer.id
    );
  };

  const addFinancialAccount = (accData: Omit<FinancialAccount, 'id'>) => {
    const newAcc: FinancialAccount = {
      ...accData,
      id: 'acc-' + Date.now(),
    };
    setData((prev) => ({
      ...prev,
      financialAccounts: [...prev.financialAccounts, newAcc],
    }));
  };

  const updateFinancialAccount = (id: string, updates: Partial<FinancialAccount>) => {
    setData((prev) => ({
      ...prev,
      financialAccounts: prev.financialAccounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  // RESERVES
  const addReserve = (resData: Omit<FinancialReserve, 'id'>) => {
    const newRes: FinancialReserve = {
      ...resData,
      id: 'res-' + Date.now(),
    };
    setData((prev) => ({
      ...prev,
      reserves: [...prev.reserves, newRes],
    }));
  };

  const updateReserve = (id: string, updates: Partial<FinancialReserve>) => {
    setData((prev) => ({
      ...prev,
      reserves: prev.reserves.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const adjustReserveAmount = (id: string, delta: number) => {
    setData((prev) => ({
      ...prev,
      reserves: prev.reserves.map((r) =>
        r.id === id ? { ...r, currentAmount: Math.max(0, r.currentAmount + delta) } : r
      ),
    }));
  };

  // PRO-LABORE
  const addProLabore = (withdrawalData: Omit<ProLaboreWithdrawal, 'id'>) => {
    const newWithdrawal: ProLaboreWithdrawal = {
      ...withdrawalData,
      id: 'pro-' + Date.now(),
    };

    // Also register corresponding Payable so cashflow and deductions reflect it cleanly
    const payable: Payable = {
      id: 'pay-pro-' + Date.now(),
      description: `Retirada Pró-labore (${withdrawalData.notes || 'Sócio Proprietário'})`,
      category: 'Pró-labore',
      supplier: 'Sócio / Fundador',
      amount: withdrawalData.amount,
      dueDate: withdrawalData.withdrawalDate,
      paymentDate: withdrawalData.status === 'Efetivado' ? withdrawalData.withdrawalDate : undefined,
      paymentMethod: 'Transferência',
      accountId: withdrawalData.accountId,
      isRecurring: true,
      status: withdrawalData.status === 'Efetivado' ? 'Pago' : 'Pendente',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setData((prev) => {
      let updatedAccounts = prev.financialAccounts;
      if (withdrawalData.status === 'Efetivado' && withdrawalData.accountId) {
        updatedAccounts = prev.financialAccounts.map((a) =>
          a.id === withdrawalData.accountId ? { ...a, balance: a.balance - withdrawalData.amount } : a
        );
      }

      return {
        ...prev,
        proLabore: [newWithdrawal, ...prev.proLabore],
        payables: [payable, ...prev.payables],
        financialAccounts: updatedAccounts,
      };
    });

    addAuditLog('Pró-labore Registrado', `Retirada de pró-labore no valor de R$ ${withdrawalData.amount}.`, 'ProLabore');
  };

  const updateProLabore = (id: string, updates: Partial<ProLaboreWithdrawal>) => {
    setData((prev) => ({
      ...prev,
      proLabore: prev.proLabore.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const addProLaboreWithdrawal = (withdrawalData: Omit<ProLaboreWithdrawal, 'id'>) => {
    addProLabore(withdrawalData);
  };

  // REFERRALS
  const addReferral = (refData: Omit<Referral, 'id'>) => {
    const newRef: Referral = {
      ...refData,
      id: 'ref-' + Date.now(),
    };
    setData((prev) => ({
      ...prev,
      referrals: [newRef, ...prev.referrals],
    }));
    addAuditLog('Indicação Registrada', `Indicação por ${newRef.referrerName} adicionada.`, 'Referral');
  };

  const updateReferral = (id: string, updates: Partial<Referral>) => {
    setData((prev) => ({
      ...prev,
      referrals: prev.referrals.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const updateReferralStatus = (id: string, status: Referral['status'], paymentDate?: string) => {
    updateReferral(id, {
      status,
      paymentDate: paymentDate || (status === 'Comissão paga' ? new Date().toISOString().split('T')[0] : undefined),
    });
  };

  // MARKETING
  const addMarketingCampaign = (campData: Omit<MarketingCampaign, 'id'>) => {
    const newCamp: MarketingCampaign = {
      ...campData,
      id: 'mkt-' + Date.now(),
    };
    setData((prev) => ({
      ...prev,
      marketingCampaigns: [newCamp, ...prev.marketingCampaigns],
    }));
  };

  const updateMarketingCampaign = (id: string, updates: Partial<MarketingCampaign>) => {
    setData((prev) => ({
      ...prev,
      marketingCampaigns: prev.marketingCampaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  // CATEGORIES
  const addCategory = (name: string, type: 'receivable' | 'payable') => {
    const newCat: CustomCategory = {
      id: 'cat-' + Date.now(),
      name,
      type,
      isActive: true,
    };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  };

  const toggleCategoryStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    }));
  };

  // GOALS & SETTINGS
  const updateGoals = (goals: Partial<BusinessGoals>) => {
    setData((prev) => ({
      ...prev,
      goals: { ...prev.goals, ...goals },
    }));
  };

  const updateSettings = (settings: Partial<CompanySettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  // BACKUP & RESTORE
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paradiso-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog('Backup Exportado', 'Arquivo JSON de backup baixado com sucesso.', 'Backup');
  };

  const restoreBackup = (jsonData: SystemData): boolean => {
    if (!jsonData || !jsonData.clients || !jsonData.receivables || !jsonData.financialAccounts) {
      return false;
    }
    setData(jsonData);
    addAuditLog('Backup Restaurado', 'Banco de dados local restaurado com sucesso a partir de backup.', 'Backup');
    return true;
  };

  const resetToInitialData = () => {
    localStorage.removeItem(STORAGE_KEY);
    for (const oldKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(oldKey);
    }
    const freshZeroData: SystemData = {
      ...initialSystemData,
      clients: [],
      projects: [],
      subscriptions: [],
      receivables: [],
      payables: [],
      transfers: [],
      reserves: [],
      proLabore: [],
      referrals: [],
      marketingCampaigns: [],
      financialAccounts: initialSystemData.financialAccounts.map((a) => ({
        ...a,
        balance: 0.0,
        initialBalance: 0.0,
      })),
    };
    setData(freshZeroData);
    addAuditLog('Reset Completo', 'Sistema reiniciado para a base zerada.', 'Settings');
  };

  const clearDatabaseAndStartFresh = async (): Promise<{ success: boolean; message: string }> => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (const oldKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(oldKey);
      }
      const freshZeroData: SystemData = {
        ...initialSystemData,
        clients: [],
        projects: [],
        subscriptions: [],
        receivables: [],
        payables: [],
        transfers: [],
        reserves: [],
        proLabore: [],
        referrals: [],
        marketingCampaigns: [],
        financialAccounts: initialSystemData.financialAccounts.map((a) => ({
          ...a,
          balance: 0.0,
          initialBalance: 0.0,
        })),
      };
      setData(freshZeroData);

      setSupabaseSyncState('syncing');
      setSupabaseSyncMessage('Zerando tabelas no Supabase...');

      const clearRes = await supabaseSyncService.clearAllDataFromSupabase();

      // Push clean snapshot
      await supabaseSyncService.pushAllDataToSupabase(freshZeroData);

      setSupabaseSyncState('synced');
      setLastSupabaseSyncTime(new Date());
      setSupabaseSyncMessage(clearRes.message);

      addAuditLog('Base Zerada', 'Base de dados resetada com sucesso. CRM pronto para operação do zero.', 'Settings');
      return clearRes;
    } catch (e: any) {
      setSupabaseSyncState('error');
      setSupabaseSyncMessage(e?.message || 'Erro ao zerar banco de dados');
      return { success: false, message: e?.message || 'Erro ao zerar banco de dados' };
    }
  };

  const exportCSV = (type: 'clients' | 'receivables' | 'payables' | 'subscriptions' | 'cashflow') => {
    let rows: string[][] = [];
    let filename = `paradiso-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'clients') {
      rows.push(['ID', 'Clínica / Empresa', 'Responsável', 'Telefone', 'Email', 'Cidade', 'Origem', 'Status', 'Recorrente', 'Total Gasto (R$)']);
      data.clients.forEach((c) => {
        rows.push([c.id, c.companyName, c.contactName, c.phone, c.email, c.city, c.origin, c.status, c.isRecurring ? 'Sim' : 'Não', (c.totalSpent || 0).toFixed(2)]);
      });
    } else if (type === 'receivables') {
      rows.push(['ID', 'Cliente', 'Descrição', 'Categoria', 'Valor Bruto (R$)', 'Taxa (R$)', 'Valor Líquido (R$)', 'Vencimento', 'Pagamento', 'Forma', 'Status']);
      data.receivables.forEach((r) => {
        const client = data.clients.find((c) => c.id === r.clientId)?.companyName || '-';
        rows.push([r.id, client, r.description, r.category, r.grossAmount.toFixed(2), r.feeAmount.toFixed(2), r.netAmount.toFixed(2), r.dueDate, r.paymentDate || '-', r.paymentMethod, r.status]);
      });
    } else if (type === 'payables') {
      rows.push(['ID', 'Descrição', 'Categoria', 'Fornecedor', 'Valor (R$)', 'Vencimento', 'Pagamento', 'Forma', 'Recorrente', 'Status']);
      data.payables.forEach((p) => {
        rows.push([p.id, p.description, p.category, p.supplier, p.amount.toFixed(2), p.dueDate, p.paymentDate || '-', p.paymentMethod, p.isRecurring ? 'Sim' : 'Não', p.status]);
      });
    } else if (type === 'subscriptions') {
      rows.push(['ID', 'Cliente', 'Plano', 'Valor Mensal (R$)', 'Início', 'Dia Vencimento', 'Próximo Vencimento', 'Status']);
      data.subscriptions.forEach((s) => {
        const client = data.clients.find((c) => c.id === s.clientId)?.companyName || '-';
        rows.push([s.id, client, s.planName, s.monthlyValue.toFixed(2), s.startDate, String(s.dueDay), s.nextDueDate, s.status]);
      });
    } else if (type === 'cashflow') {
      rows.push(['Data', 'Tipo', 'Descrição', 'Entrada (R$)', 'Saída (R$)', 'Conta']);
      data.receivables.filter((r) => r.status === 'Pago').forEach((r) => {
        const acc = data.financialAccounts.find((a) => a.id === r.accountId)?.name || 'Conta';
        rows.push([r.paymentDate || r.dueDate, 'Entrada', r.description, r.netAmount.toFixed(2), '0,00', acc]);
      });
      data.payables.filter((p) => p.status === 'Pago').forEach((p) => {
        const acc = data.financialAccounts.find((a) => a.id === p.accountId)?.name || 'Conta';
        rows.push([p.paymentDate || p.dueDate, 'Saída', p.description, '0,00', p.amount.toFixed(2), acc]);
      });
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.map((x) => `"${(x || '').toString().replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppContext.Provider
      value={{
        data,
        period,
        customDateRange,
        currentView,
        selectedClientId,
        isLocked,
        isSidebarCollapsed,
        setPeriod,
        setCustomDateRange,
        setCurrentView,
        setSelectedClientId,
        setIsLocked,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        verifyLockPin,

        supabaseSyncState,
        lastSupabaseSyncTime,
        supabaseSyncMessage,
        isSupabaseAutoSyncEnabled,
        setIsSupabaseAutoSyncEnabled,
        forceSyncSupabase,
        pullFromSupabase,

        addClient,
        updateClient,
        deleteClient,
        updatePipelineStage,
        updateClientPipelineStage: updatePipelineStage,

        addProject,
        updateProject,
        deleteProject,

        addSubscription,
        updateSubscription,
        updateSubscriptionStatus,
        cancelSubscription,

        addReceivable,
        markReceivableAsPaid,
        updateReceivable,
        deleteReceivable,

        addPayable,
        markPayableAsPaid,
        updatePayable,
        deletePayable,

        createInfinitePaySale,
        createSiteAndCarePlanBundle,

        executeTransfer,
        addFinancialAccount,
        updateFinancialAccount,

        addReserve,
        updateReserve,
        adjustReserveAmount,

        addProLabore,
        addProLaboreWithdrawal,
        updateProLabore,

        addReferral,
        updateReferral,
        updateReferralStatus,

        addMarketingCampaign,
        updateMarketingCampaign,

        addCategory,
        toggleCategoryStatus,

        updateGoals,
        updateSettings,

        exportBackup,
        exportBackupJSON: exportBackup,
        restoreBackup,
        importBackupJSON: (jsonStr: string) => {
          try {
            const parsed = JSON.parse(jsonStr);
            return restoreBackup(parsed);
          } catch {
            return false;
          }
        },
        resetToInitialData,
        resetToDemoData: resetToInitialData,
        clearDatabaseAndStartFresh,
        lockApp: () => setIsLocked(true),
        unlockApp: () => setIsLocked(false),
        exportCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
