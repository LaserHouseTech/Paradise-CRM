import {
  Client,
  Project,
  Subscription,
  Receivable,
  Payable,
  FinancialAccount,
  PeriodFilter,
  MarketingCampaign,
} from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRangeForFilter(
  filter: PeriodFilter,
  customRange?: { start: string; end: string }
): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (filter) {
    case 'today':
      return { start: today, end: endOfDay };
    case 'this_week': {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59);
      return { start: monday, end: sunday };
    }
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: firstDay, end: lastDay };
    }
    case 'last_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: firstDay, end: lastDay };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return { start, end: endOfDay };
    }
    case 'last_90_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return { start, end: endOfDay };
    }
    case 'this_year': {
      const firstDay = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start: firstDay, end: lastDay };
    }
    case 'custom': {
      if (customRange?.start && customRange?.end) {
        const start = new Date(customRange.start + 'T00:00:00');
        const end = new Date(customRange.end + 'T23:59:59');
        return { start, end };
      }
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay,
      };
    }
    default:
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay,
      };
  }
}

export function isDateInRange(dateStr?: string, range?: DateRange): boolean {
  if (!dateStr || !range) return false;
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
  return d >= range.start && d <= range.end;
}

export interface DashboardMetrics {
  faturamentoMes: number; // Faturamento do mês (vendas brutas contratadas no período)
  receitaRecebida: number; // Receitas efetivamente recebidas no período
  receitaLiquida: number; // Receita recebida menos taxas
  aReceberPendente: number; // Contas a receber pendentes totais
  aPagarPendente: number; // Contas a pagar pendentes totais
  despesasPagas: number; // Despesas pagas no período
  proLaborePago: number; // Pró-labore pago no período
  mrrContratado: number; // Soma de mensalidades ativas
  mrrRecebido: number; // Mensalidades recorrentes recebidas no período
  mrrEmRisco: number; // Mensalidades atrasadas
  totalClientes: number; // Total clientes
  clientesRecorrentes: number; // Clientes no plano de cuidado ativo
  caixaDisponivel: number; // Saldo das contas financeiras
  resultadoMes: number; // Receita recebida - Despesas pagas
  totalInadimplencia: number; // Soma de recebíveis vencidos e não pagos
}

export function calculateDashboardMetrics(
  clients: Client[],
  projects: Project[],
  subscriptions: Subscription[],
  receivables: Receivable[],
  payables: Payable[],
  accounts: FinancialAccount[],
  period: PeriodFilter,
  customRange?: { start: string; end: string }
): DashboardMetrics {
  const range = getDateRangeForFilter(period, customRange);

  // Faturamento no período: soma dos projetos fechados / contratados dentro do período
  const faturamentoMes = projects
    .filter((p) => p.status !== 'Cancelado' && isDateInRange(p.contractDate, range))
    .reduce((sum, p) => sum + p.contractValue, 0);

  // Receita recebida no período: recebíveis com status 'Pago' e paymentDate no range
  const paidReceivablesInPeriod = receivables.filter(
    (r) => r.status === 'Pago' && isDateInRange(r.paymentDate || r.dueDate, range)
  );

  const receitaRecebida = paidReceivablesInPeriod.reduce((sum, r) => sum + r.grossAmount, 0);
  const receitaLiquida = paidReceivablesInPeriod.reduce((sum, r) => sum + (r.netAmount || (r.grossAmount - r.feeAmount)), 0);

  // Contas a receber pendentes (geral)
  const aReceberPendente = receivables
    .filter((r) => r.status === 'Pendente' || r.status === 'Vencido')
    .reduce((sum, r) => sum + r.grossAmount, 0);

  // Contas a pagar pendentes (geral)
  const aPagarPendente = payables
    .filter((p) => p.status === 'Pendente' || p.status === 'Vencido')
    .reduce((sum, p) => sum + p.amount, 0);

  // Despesas pagas no período
  const paidPayablesInPeriod = payables.filter(
    (p) => p.status === 'Pago' && isDateInRange(p.paymentDate || p.dueDate, range)
  );

  const despesasPagas = paidPayablesInPeriod
    .filter((p) => p.category !== 'Pró-labore')
    .reduce((sum, p) => sum + p.amount, 0);

  const proLaborePago = paidPayablesInPeriod
    .filter((p) => p.category === 'Pró-labore')
    .reduce((sum, p) => sum + p.amount, 0);

  // MRR calculations:
  // Active subscriptions
  const activeSubs = subscriptions.filter((s) => s.status === 'Ativo');
  const mrrContratado = activeSubs.reduce((sum, s) => sum + s.monthlyValue, 0);

  // Overdue / In risk subscriptions
  const riskSubs = subscriptions.filter((s) => s.status === 'Em atraso');
  const mrrEmRisco = riskSubs.reduce((sum, s) => sum + s.monthlyValue, 0);

  // Recurring revenue received in period
  const mrrRecebido = paidReceivablesInPeriod
    .filter((r) => r.category === 'Plano de Cuidado Digital' || r.category === 'Recorrência')
    .reduce((sum, r) => sum + r.grossAmount, 0);

  // Clients stats
  const totalClientes = clients.filter((c) => c.status !== 'Perdido' && c.status !== 'Cancelado').length;
  const clientesRecorrentes = activeSubs.length;

  // Caixa disponível (saldo das contas financeiras ativas)
  const caixaDisponivel = accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + a.balance, 0);

  // Resultado do período: Receita recebida - Todas as saídas pagas (despesas + pro labore)
  const resultadoMes = receitaRecebida - (despesasPagas + proLaborePago);

  // Inadimplência total
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueReceivables = receivables.filter(
    (r) => r.status === 'Vencido' || (r.status === 'Pendente' && r.dueDate < todayStr)
  );
  const totalInadimplencia = overdueReceivables.reduce((sum, r) => sum + r.grossAmount, 0);

  return {
    faturamentoMes,
    receitaRecebida,
    receitaLiquida,
    aReceberPendente,
    aPagarPendente,
    despesasPagas,
    proLaborePago,
    mrrContratado,
    mrrRecebido,
    mrrEmRisco,
    totalClientes,
    clientesRecorrentes,
    caixaDisponivel,
    resultadoMes,
    totalInadimplencia,
  };
}

export interface AttentionAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  count?: number;
  amount?: number;
  actionRoute?: string;
}

export function generateAttentionAlerts(
  receivables: Receivable[],
  payables: Payable[],
  subscriptions: Subscription[],
  projects: Project[]
): AttentionAlert[] {
  const alerts: AttentionAlert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const todayStr = today.toISOString().split('T')[0];
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  // 1. Recebíveis vencidos (Inadimplência)
  const overdueReceivables = receivables.filter(
    (r) => r.status === 'Vencido' || (r.status === 'Pendente' && r.dueDate < todayStr)
  );
  if (overdueReceivables.length > 0) {
    const sumOverdue = overdueReceivables.reduce((acc, r) => acc + r.grossAmount, 0);
    alerts.push({
      id: 'overdue-receivables',
      type: 'danger',
      title: `${overdueReceivables.length} recebimento(s) em atraso`,
      description: `Total de R$ ${sumOverdue.toFixed(2).replace('.', ',')} pendente com clientes.`,
      count: overdueReceivables.length,
      amount: sumOverdue,
      actionRoute: 'receivables',
    });
  }

  // 2. Mensalidades do Plano de Cuidado atrasadas
  const overdueSubs = subscriptions.filter((s) => s.status === 'Em atraso');
  if (overdueSubs.length > 0) {
    const sumRisk = overdueSubs.reduce((acc, s) => acc + s.monthlyValue, 0);
    alerts.push({
      id: 'overdue-subs',
      type: 'danger',
      title: `${overdueSubs.length} mensalidade(s) em atraso (MRR em risco)`,
      description: `R$ ${sumRisk.toFixed(2).replace('.', ',')} de mensalidades atrasadas requerem contato.`,
      count: overdueSubs.length,
      amount: sumRisk,
      actionRoute: 'subscriptions',
    });
  }

  // 3. Contas a pagar vencendo nos próximos 7 dias
  const payablesDueSoon = payables.filter(
    (p) =>
      (p.status === 'Pendente' || p.status === 'Vencido') &&
      p.dueDate >= todayStr &&
      p.dueDate <= in7DaysStr
  );
  if (payablesDueSoon.length > 0) {
    const sumPayables = payablesDueSoon.reduce((acc, p) => acc + p.amount, 0);
    alerts.push({
      id: 'payables-due-soon',
      type: 'warning',
      title: `${payablesDueSoon.length} conta(s) vencem nos próximos 7 dias`,
      description: `Previsão de saída de R$ ${sumPayables.toFixed(2).replace('.', ',')}.`,
      count: payablesDueSoon.length,
      amount: sumPayables,
      actionRoute: 'payables',
    });
  }

  // 4. Recebimentos previstos para os próximos 7 dias
  const receivablesDueSoon = receivables.filter(
    (r) => r.status === 'Pendente' && r.dueDate >= todayStr && r.dueDate <= in7DaysStr
  );
  if (receivablesDueSoon.length > 0) {
    const sumProjectedIn = receivablesDueSoon.reduce((acc, r) => acc + r.grossAmount, 0);
    alerts.push({
      id: 'receivables-due-soon',
      type: 'info',
      title: `R$ ${sumProjectedIn.toFixed(2).replace('.', ',')} previstos para entrar nesta semana`,
      description: `${receivablesDueSoon.length} fatura(s) têm vencimento nos próximos 7 dias.`,
      count: receivablesDueSoon.length,
      amount: sumProjectedIn,
      actionRoute: 'receivables',
    });
  }

  // 5. Projetos sem pagamento registrado
  const unpaidProjects = projects.filter(
    (p) => p.status !== 'Cancelado' && p.status !== 'Finalizado' && p.paidAmount === 0
  );
  if (unpaidProjects.length > 0) {
    alerts.push({
      id: 'unpaid-projects',
      type: 'warning',
      title: `${unpaidProjects.length} projeto(s) ativos sem entrada registrada`,
      description: `Certifique-se de registrar a entrada ou primeira parcela dos projetos.`,
      count: unpaidProjects.length,
      actionRoute: 'projects',
    });
  }

  return alerts;
}

export function calculateFinancialForecast(
  receivables: Receivable[],
  payables: Payable[],
  subscriptions: Subscription[],
  currentCash: number = 0,
  days: number = 30
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  const todayStr = today.toISOString().split('T')[0];
  const futureStr = futureDate.toISOString().split('T')[0];

  const mrr = subscriptions
    .filter((s) => s.status === 'Ativo')
    .reduce((sum, s) => sum + s.monthlyValue, 0);

  const recurringExpenses = payables
    .filter((p) => p.isRecurring)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingIn = receivables
    .filter((r) => r.status === 'Pendente' && r.dueDate >= todayStr && r.dueDate <= futureStr)
    .reduce((sum, r) => sum + r.grossAmount, 0);

  const months = days / 30;
  const projectedInflows = pendingIn + mrr * Math.max(0, months - (days <= 30 ? 0 : 0.5));

  const pendingOut = payables
    .filter((p) => p.status === 'Pendente' && p.dueDate >= todayStr && p.dueDate <= futureStr)
    .reduce((sum, p) => sum + p.amount, 0);

  const projectedOutflows = pendingOut + recurringExpenses * Math.max(0, months - 1);

  return {
    days,
    projectedInflows,
    projectedOutflows,
    projectedEndingBalance: currentCash + projectedInflows - projectedOutflows,
  };
}

export function calculateForecast(
  receivables: Receivable[],
  payables: Payable[],
  subscriptions: Subscription[]
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periods = [
    { label: 'Próximos 7 dias', days: 7 },
    { label: 'Próximos 30 dias', days: 30 },
    { label: 'Próximos 60 dias', days: 60 },
    { label: 'Próximos 90 dias', days: 90 },
    { label: 'Próximos 6 meses', days: 180 },
    { label: 'Próximos 12 meses', days: 365 },
  ];

  const activeMonthlyMrr = subscriptions
    .filter((s) => s.status === 'Ativo')
    .reduce((acc, s) => acc + s.monthlyValue, 0);

  const recurringMonthlyExpenses = payables
    .filter((p) => p.isRecurring)
    .reduce((acc, p) => acc + p.amount, 0);

  return periods.map((p) => {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + p.days);
    const futureStr = futureDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Contas a receber já agendadas até a data
    const scheduledIn = receivables
      .filter((r) => r.status === 'Pendente' && r.dueDate >= todayStr && r.dueDate <= futureStr)
      .reduce((sum, r) => sum + r.grossAmount, 0);

    // Meses estimados
    const months = p.days / 30;
    // MRR recorrente adicional além dos recebíveis individuais já registrados
    const projectedMrr = activeMonthlyMrr * Math.max(0, months - 1);

    const projectedRevenue = scheduledIn + projectedMrr;

    // Despesas agendadas + despesas recorrentes projetadas
    const scheduledOut = payables
      .filter((pay) => pay.status === 'Pendente' && pay.dueDate >= todayStr && pay.dueDate <= futureStr)
      .reduce((sum, pay) => sum + pay.amount, 0);

    const projectedRecurringExpense = recurringMonthlyExpenses * Math.max(0, months - 1);
    const projectedExpense = scheduledOut + projectedRecurringExpense;

    return {
      period: p.label,
      days: p.days,
      projectedRevenue,
      projectedExpense,
      projectedResult: projectedRevenue - projectedExpense,
    };
  });
}
