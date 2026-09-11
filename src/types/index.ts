export type PeriodFilter = 
  | 'today' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'this_year' 
  | 'custom';

export type ClientStatus = 
  | 'Lead' 
  | 'Em negociação' 
  | 'Proposta enviada' 
  | 'Cliente ativo' 
  | 'Cliente recorrente' 
  | 'Cliente inativo' 
  | 'Cancelado' 
  | 'Perdido';

export type PipelineStage = 
  | 'Prospectado' 
  | 'Demo pronta' 
  | 'Demo apresentada' 
  | 'Negociação' 
  | 'Fechado' 
  | 'Perdido';

export type ClientOrigin = 
  | 'Prospecção ativa' 
  | 'Instagram' 
  | 'Tráfego pago' 
  | 'Indicação' 
  | 'Orgânico' 
  | 'Outros';

export interface Client {
  id: string;
  companyName: string; // Nome da clínica/empresa
  contactName: string; // Nome do responsável
  avatarUrl?: string; // Foto de perfil / Logotipo do cliente
  document: string; // CPF/CNPJ
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  instagram?: string;
  currentWebsite?: string;
  address?: string;
  notes?: string;
  createdAt: string; // YYYY-MM-DD
  origin: ClientOrigin;
  status: ClientStatus;
  pipelineStage?: PipelineStage;
  potentialValue?: number;
  lastContactDate?: string;
  nextAction?: string;
  isRecurring: boolean; // Cliente recorrente: sim/não
  totalSpent?: number;
  selectedServiceIds?: string[];
  proposedServices?: string[];
}

export type ProjectStatus = 
  | 'Briefing'
  | 'Conteúdo'
  | 'Design/Estrutura'
  | 'Desenvolvimento'
  | 'Revisão do cliente'
  | 'Finalizado'
  | 'Pausado'
  | 'Aguardando início' 
  | 'Em desenvolvimento' 
  | 'Aguardando cliente' 
  | 'Revisão' 
  | 'Cancelado';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  serviceId: string;
  serviceName: string;
  contractValue: number;
  contractDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  status: ProjectStatus;
  paymentMethod: string;
  installments: number;
  paidAmount: number;
  notes?: string;
  hasCarePlan: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  monthlyPrice?: number;
  category: 'Site' | 'Plano' | 'Serviço Extra' | 'Outro';
  isActive: boolean;
}

export type ServiceCatalogItem = ServiceItem;

export type SubscriptionStatus = 
  | 'Ativo' 
  | 'Pendente' 
  | 'Em atraso' 
  | 'Cancelado' 
  | 'Suspenso';

export interface Subscription {
  id: string;
  clientId: string;
  planName: string;
  monthlyValue: number;
  startDate: string; // YYYY-MM-DD
  dueDay: number; // dia do mês para vencimento (ex: 10)
  nextDueDate: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  minimumTermMonths?: number;
  notes?: string;
}

export type PaymentMethod = 
  | 'Pix' 
  | 'Dinheiro' 
  | 'Cartão de crédito' 
  | 'Cartão de débito' 
  | 'Transferência' 
  | 'InfinitePay' 
  | 'Outro';

export type ReceivableStatus = 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';

export interface Receivable {
  id: string;
  clientId: string;
  projectId?: string;
  subscriptionId?: string;
  description: string;
  category: string; // Sites | Plano de Cuidado Digital | Serviços extras | Outros
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  accountId?: string; // Conta financeira que recebeu
  status: ReceivableStatus;
  installmentNumber?: number;
  totalInstallments?: number;
  notes?: string;
  createdAt: string;
}

export type PayableStatus = 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';

export interface Payable {
  id: string;
  description: string;
  category: string;
  supplier: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  accountId?: string; // Conta de onde saiu o valor
  isRecurring: boolean;
  status: PayableStatus;
  notes?: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string; // ex: "Conta Bancária Inter", "InfinitePay Saldo", "Cofre Físico"
  type: 'bank' | 'gateway' | 'cash' | 'other';
  balance: number;
  initialBalance: number;
  color?: string;
  isActive: boolean;
}

export interface InternalTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface FinancialReserve {
  id: string;
  name: string; // Reserva de Emergência, Reserva para Impostos, etc.
  targetAmount: number;
  currentAmount: number;
  objective?: string;
  notes?: string;
}

export interface ProLaboreWithdrawal {
  id: string;
  amount: number;
  withdrawalDate: string;
  accountId: string;
  status: 'Efetivado' | 'Programado';
  notes?: string;
}

export type ReferralStatus = 
  | 'Indicação recebida' 
  | 'Em negociação' 
  | 'Fechou' 
  | 'Não fechou' 
  | 'Comissão pendente' 
  | 'Comissão paga';

export interface Referral {
  id: string;
  referrerName: string;
  referredClientName: string;
  referredClientId?: string;
  referralDate: string;
  saleValue?: number;
  commissionAmount: number; // default R$ 200
  paymentDate?: string;
  status: ReferralStatus;
  notes?: string;
}

export interface MarketingCampaign {
  id: string;
  channel: string; // ex: Tráfego Pago Meta, Google Ads, Prospecção
  period: string; // ex: Setembro 2026
  startDate: string;
  endDate?: string;
  investmentAmount: number;
  leadsCount: number;
  clientsConvertedCount: number;
  revenueGenerated: number;
  notes?: string;
}

export type MarketingExpense = MarketingCampaign;

export interface CustomCategory {
  id: string;
  name: string;
  type: 'receivable' | 'payable';
  isActive: boolean;
}

export interface BusinessGoals {
  monthlyRevenueGoal: number; // ex: 10000
  monthlyMrrGoal: number; // ex: 5000
  totalClientsGoal: number; // ex: 30
  recurringClientsGoal: number; // ex: 20
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  entityType?: string;
  entityId?: string;
}

export interface CompanySettings {
  companyName: string;
  brandSlogan?: string;
  document: string; // CNPJ
  phone: string;
  email: string;
  address: string;
  currency: string;
  defaultReferralReward: number;
  defaultCarePlanPrice: number;
  defaultStandaloneSitePrice: number;
  defaultBundleSitePrice: number;
  lockPin?: string; // Para bloqueio de tela local
  isLocked?: boolean;
  // Perfil do Usuário Administrador
  userName?: string;
  userRole?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  // Compatibilidade com telas de configurações
  agencyName?: string;
  ownerName?: string;
  cnpj?: string;
  defaultPixKey?: string;
  defaultTaxRate?: number;
  defaultInfinitePayRate?: number;
  defaultProLaboreMonthly?: number;
  accessPassword?: string;
}

export interface SystemData {
  clients: Client[];
  projects: Project[];
  services: ServiceItem[];
  subscriptions: Subscription[];
  receivables: Receivable[];
  payables: Payable[];
  financialAccounts: FinancialAccount[];
  transfers: InternalTransfer[];
  reserves: FinancialReserve[];
  proLabore: ProLaboreWithdrawal[];
  referrals: Referral[];
  marketingCampaigns: MarketingCampaign[];
  categories: CustomCategory[];
  goals: BusinessGoals;
  settings: CompanySettings;
  auditLogs: AuditLog[];
}
