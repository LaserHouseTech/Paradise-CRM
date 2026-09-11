import { supabase, checkSupabaseHealth, SupabaseHealthStatus } from '../lib/supabase';
import { initialSystemData } from '../data/initialData';
import {
  SystemData,
  Client,
  Project,
  Subscription,
  Receivable,
  Payable,
  FinancialAccount,
} from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  tablesSynced?: string[];
  tablesFailed?: string[];
  error?: string;
}

export const supabaseSyncService = {
  /**
   * Check connection and schema state
   */
  async checkStatus(): Promise<SupabaseHealthStatus> {
    return await checkSupabaseHealth();
  },

  /**
   * Save the entire system state snapshot to Supabase across all tables
   */
  async pushAllDataToSupabase(data: SystemData): Promise<SyncResult> {
    const tablesSynced: string[] = [];
    const tablesFailed: string[] = [];
    let hasAnySuccess = false;

    // 1. Full state JSON to `app_state_backup`
    try {
      const { error: backupError } = await supabase
        .from('app_state_backup')
        .upsert({
          id: 'latest',
          data: data,
          updated_at: new Date().toISOString(),
        });

      if (!backupError) {
        tablesSynced.push('app_state_backup');
        hasAnySuccess = true;
      } else {
        tablesFailed.push('app_state_backup');
      }
    } catch {
      tablesFailed.push('app_state_backup');
    }

    // 2. Sync clients
    try {
      if (data.clients && data.clients.length > 0) {
        const payload = data.clients.map((c: Client) => ({
          id: c.id,
          company_name: c.companyName,
          contact_name: c.contactName,
          document: c.document,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          city: c.city,
          state: c.state,
          address: c.address,
          status: c.status,
          origin: c.origin,
          notes: c.notes,
          avatar_url: c.avatarUrl,
          instagram: c.instagram,
          current_website: c.currentWebsite,
          is_recurring: c.isRecurring,
          pipeline_stage: c.pipelineStage || (c.status === 'Cliente ativo' ? 'Fechado' : 'Prospectado'),
          created_at: c.createdAt,
          updated_at: new Date().toISOString(),
        }));

        let { error } = await supabase.from('clients').upsert(payload);
        if (error) {
          // Fallback if pipeline_stage column is not in remote database yet
          const fallbackPayload = payload.map(({ pipeline_stage, ...rest }) => rest);
          const fallbackRes = await supabase.from('clients').upsert(fallbackPayload);
          error = fallbackRes.error;
        }

        if (!error) {
          tablesSynced.push(`clients (${data.clients.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('clients');
        }
      }
    } catch {
      tablesFailed.push('clients');
    }

    // 3. Sync contracts (projects & subscriptions)
    try {
      const contractPayload: any[] = [];
      if (data.projects && data.projects.length > 0) {
        data.projects.forEach((p: Project) => {
          contractPayload.push({
            id: p.id,
            client_id: p.clientId,
            contract_number: p.id,
            title: p.name,
            total_value: p.contractValue || 0,
            monthly_value: 0,
            start_date: p.contractDate || null,
            end_date: p.deliveryDate || null,
            status: p.status,
            services: [p.serviceName || 'Desenvolvimento Web'],
            payment_method: p.paymentMethod || 'À vista / Parcelado',
            notes: p.notes || null,
            created_at: p.contractDate ? new Date(p.contractDate).toISOString() : new Date().toISOString(),
          });
        });
      }
      if (data.subscriptions && data.subscriptions.length > 0) {
        data.subscriptions.forEach((s: Subscription) => {
          contractPayload.push({
            id: s.id,
            client_id: s.clientId,
            contract_number: s.id,
            title: s.planName,
            total_value: (s.monthlyValue || 0) * (s.minimumTermMonths || 12),
            monthly_value: s.monthlyValue,
            start_date: s.startDate || null,
            end_date: s.nextDueDate || null,
            status: s.status,
            services: ['Plano de Cuidado Digital'],
            payment_method: 'Recorrência Mensal',
            notes: s.notes || null,
            created_at: s.startDate ? new Date(s.startDate).toISOString() : new Date().toISOString(),
          });
        });
      }

      if (contractPayload.length > 0) {
        const { error } = await supabase.from('contracts').upsert(contractPayload);
        if (!error) {
          tablesSynced.push(`contracts (${contractPayload.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('contracts');
        }
      }
    } catch {
      tablesFailed.push('contracts');
    }

    // 4. Sync receivables
    try {
      if (data.receivables && data.receivables.length > 0) {
        const payload = data.receivables.map((r: Receivable) => ({
          id: r.id,
          client_id: r.clientId,
          contract_id: r.projectId,
          description: r.description,
          gross_amount: r.grossAmount,
          tax_amount: r.feeAmount,
          net_amount: r.netAmount,
          due_date: r.dueDate,
          payment_date: r.paymentDate,
          status: r.status,
          payment_method: r.paymentMethod,
          destination_account_id: r.accountId,
          notes: r.notes,
          created_at: r.createdAt,
        }));

        const { error } = await supabase.from('receivables').upsert(payload);
        if (!error) {
          tablesSynced.push(`receivables (${data.receivables.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('receivables');
        }
      }
    } catch {
      tablesFailed.push('receivables');
    }

    // 5. Sync expenses / payables
    try {
      if (data.payables && data.payables.length > 0) {
        const payload = data.payables.map((p: Payable) => ({
          id: p.id,
          description: p.description,
          category: p.category,
          amount: p.amount,
          due_date: p.dueDate,
          payment_date: p.paymentDate,
          status: p.status,
          payment_method: p.paymentMethod,
          source_account_id: p.accountId,
          is_recurring: p.isRecurring,
          supplier: p.supplier,
          notes: p.notes,
          created_at: p.createdAt,
        }));

        const { error } = await supabase.from('expenses').upsert(payload);
        if (!error) {
          tablesSynced.push(`expenses (${data.payables.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('expenses');
        }
      }
    } catch {
      tablesFailed.push('expenses');
    }

    // 6. Sync leads
    try {
      const leadsPayload = data.clients
        .filter((c: Client) => c.status === 'Lead' || c.status === 'Em negociação' || Boolean(c.pipelineStage))
        .map((c: Client) => ({
          id: 'lead-' + c.id,
          name: c.contactName || c.companyName,
          company: c.companyName,
          phone: c.phone || c.whatsapp,
          email: c.email,
          status: c.pipelineStage || c.status || 'Novo',
          value: c.potentialValue || c.totalSpent || 0,
          source: c.origin || 'Prospecção ativa',
          notes: c.notes,
          created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        }));

      if (leadsPayload.length > 0) {
        const { error } = await supabase.from('leads').upsert(leadsPayload);
        if (!error) {
          tablesSynced.push(`leads (${leadsPayload.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('leads');
        }
      }
    } catch {
      tablesFailed.push('leads');
    }

    // 7. Sync tasks
    try {
      const tasksPayload = (data.projects || []).map((p: Project) => {
        const client = data.clients.find((c) => c.id === p.clientId);
        return {
          id: 'task-' + p.id,
          title: `Entrega: ${p.name}`,
          client_name: client ? client.companyName : p.name,
          due_date: p.deliveryDate || null,
          priority: 'Alta',
          status: p.status === 'Finalizado' ? 'Concluída' : 'Pendente',
          description: `Serviço: ${p.serviceName} | Status: ${p.status}`,
          created_at: p.contractDate ? new Date(p.contractDate).toISOString() : new Date().toISOString(),
        };
      });

      if (tasksPayload.length > 0) {
        const { error } = await supabase.from('tasks').upsert(tasksPayload);
        if (!error) {
          tablesSynced.push(`tasks (${tasksPayload.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('tasks');
        }
      }
    } catch {
      tablesFailed.push('tasks');
    }

    // 8. Sync financial accounts
    try {
      if (data.financialAccounts && data.financialAccounts.length > 0) {
        const payload = data.financialAccounts.map((a: FinancialAccount) => ({
          id: a.id,
          name: a.name,
          bank: a.name,
          initial_balance: a.initialBalance,
          current_balance: a.balance,
          account_type: a.type,
          is_active: a.isActive,
        }));

        const { error } = await supabase.from('financial_accounts').upsert(payload);
        if (!error) {
          tablesSynced.push(`financial_accounts (${data.financialAccounts.length})`);
          hasAnySuccess = true;
        } else {
          tablesFailed.push('financial_accounts');
        }
      }
    } catch {
      tablesFailed.push('financial_accounts');
    }

    // 9. Sync company & profile settings
    try {
      const s = data.settings;
      const { error } = await supabase.from('company_settings').upsert({
        id: 'default',
        company_name: s.companyName,
        agency_name: s.agencyName,
        owner_name: s.ownerName,
        user_name: s.userName,
        user_role: s.userRole,
        user_email: s.userEmail,
        user_avatar_url: s.userAvatarUrl,
        cnpj: s.cnpj,
        default_pix_key: s.defaultPixKey,
        default_tax_rate: s.defaultTaxRate,
        default_infinite_pay_rate: s.defaultInfinitePayRate,
        default_pro_labore_monthly: s.defaultProLaboreMonthly,
        lock_pin: s.lockPin,
        is_locked: s.isLocked,
        updated_at: new Date().toISOString(),
      });
      if (!error) {
        tablesSynced.push('company_settings');
        hasAnySuccess = true;
      } else {
        tablesFailed.push('company_settings');
      }
    } catch {
      tablesFailed.push('company_settings');
    }

    if (hasAnySuccess) {
      return {
        success: true,
        message: `Sincronização com Supabase concluída! Tabelas atualizadas: ${tablesSynced.join(', ')}`,
        tablesSynced,
        tablesFailed,
      };
    } else {
      return {
        success: false,
        message:
          'As tabelas do Supabase ainda não foram criadas no banco de dados. Execute o script supabase_schema.sql no SQL Editor do Supabase para criá-las.',
        tablesFailed,
      };
    }
  },

  /**
   * Pull data from Supabase into local state
   */
  async pullDataFromSupabase(): Promise<{ success: boolean; data?: SystemData; message: string }> {
    try {
      // 1. Fetch from primary relational tables in parallel
      const [
        clientsRes,
        contractsRes,
        receivablesRes,
        expensesRes,
        accountsRes,
        settingsRes,
        backupRes,
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('receivables').select('*').order('due_date', { ascending: true }),
        supabase.from('expenses').select('*').order('due_date', { ascending: true }),
        supabase.from('financial_accounts').select('*'),
        supabase.from('company_settings').select('*').limit(1),
        supabase.from('app_state_backup').select('data').eq('id', 'latest').maybeSingle(),
      ]);

      const clientsRows = clientsRes.data || [];
      const contractsRows = contractsRes.data || [];
      const receivablesRows = receivablesRes.data || [];
      const expensesRows = expensesRes.data || [];
      const accountsRows = accountsRes.data || [];
      const settingsRows = settingsRes.data || [];
      const backupData = backupRes.data?.data as Partial<SystemData> | undefined;

      const hasRelationalData =
        clientsRows.length > 0 ||
        contractsRows.length > 0 ||
        receivablesRows.length > 0 ||
        expensesRows.length > 0;

      // If no relational records, but backup has clients or records, fallback to backup
      if (!hasRelationalData && backupData && backupData.clients && backupData.clients.length > 0) {
        return {
          success: true,
          data: {
            ...initialSystemData,
            ...backupData,
          },
          message: 'Dados recuperados do backup integral do Supabase!',
        };
      }

      if (!hasRelationalData && (!backupData || !backupData.clients || backupData.clients.length === 0)) {
        return {
          success: false,
          message: 'Nenhum dado encontrado no banco de dados Supabase.',
        };
      }

      // Map Receivables first (used to compute client totalSpent)
      const mappedReceivables: Receivable[] = receivablesRows.map((r: any) => ({
        id: r.id,
        clientId: r.client_id,
        projectId: r.contract_id || undefined,
        description: r.description || 'Fatura',
        category:
          r.description?.toLowerCase().includes('plano') || r.description?.toLowerCase().includes('cuidado')
            ? 'Plano de Cuidado Digital'
            : 'Sites',
        grossAmount: Number(r.gross_amount) || 0,
        feeAmount: Number(r.tax_amount) || 0,
        netAmount: Number(r.net_amount) || Number(r.gross_amount) || 0,
        dueDate: r.due_date || new Date().toISOString().split('T')[0],
        paymentDate: r.payment_date || undefined,
        paymentMethod: (r.payment_method as any) || 'InfinitePay',
        accountId: r.destination_account_id || 'acc-1',
        status: (r.status as any) || 'Pendente',
        notes: r.notes || '',
        createdAt: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));

      // Map Clients
      const mappedClients: Client[] = clientsRows.map((c: any) => {
        const clientPaid = mappedReceivables
          .filter((rec) => rec.clientId === c.id && rec.status === 'Pago')
          .reduce((sum, rec) => sum + rec.grossAmount, 0);

        const defaultStage =
          c.status === 'Cliente ativo' || c.status === 'Cliente recorrente'
            ? 'Fechado'
            : c.status === 'Em negociação'
            ? 'Negociação'
            : c.status === 'Proposta enviada'
            ? 'Proposta enviada'
            : c.status === 'Perdido' || c.status === 'Cancelado'
            ? 'Perdido'
            : 'Prospectado';

        return {
          id: c.id,
          companyName: c.company_name || 'Cliente Sem Nome',
          contactName: c.contact_name || c.company_name || 'Responsável',
          document: c.document || '',
          phone: c.phone || '',
          whatsapp: c.whatsapp || c.phone || '',
          email: c.email || '',
          city: c.city || '',
          state: c.state || '',
          address: c.address || '',
          status: (c.status as any) || 'Cliente ativo',
          pipelineStage: (c.pipeline_stage as any) || defaultStage,
          origin: (c.origin as any) || 'Prospecção ativa',
          notes: c.notes || '',
          avatarUrl: c.avatar_url || undefined,
          instagram: c.instagram || '',
          currentWebsite: c.current_website || '',
          isRecurring: Boolean(c.is_recurring),
          createdAt: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          totalSpent: clientPaid,
        };
      });

      // Map Contracts -> Projects & Subscriptions
      const mappedProjects: Project[] = [];
      const mappedSubscriptions: Subscription[] = [];

      contractsRows.forEach((ct: any) => {
        const isSub =
          ct.id.startsWith('sub-') ||
          (Number(ct.monthly_value) > 0 && !ct.id.startsWith('prj-'));

        if (isSub) {
          mappedSubscriptions.push({
            id: ct.id,
            clientId: ct.client_id,
            planName: ct.title || 'Plano de Cuidado Digital',
            monthlyValue: Number(ct.monthly_value) || 197,
            startDate:
              ct.start_date || (ct.created_at ? ct.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            dueDay: 10,
            nextDueDate: ct.end_date || '',
            status: (ct.status as any) || 'Ativo',
            minimumTermMonths: 12,
            notes: ct.notes || '',
          });
        } else {
          mappedProjects.push({
            id: ct.id,
            name: ct.title || 'Projeto Web',
            clientId: ct.client_id,
            serviceId: 'srv-2',
            serviceName:
              Array.isArray(ct.services) && ct.services[0] ? ct.services[0] : 'Desenvolvimento de Site',
            contractValue: Number(ct.total_value) || 0,
            contractDate:
              ct.start_date || (ct.created_at ? ct.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
            deliveryDate: ct.end_date || '',
            status: (ct.status as any) || 'Em desenvolvimento',
            paymentMethod: ct.payment_method || 'InfinitePay',
            installments: 3,
            paidAmount: 0,
            hasCarePlan: true,
            notes: ct.notes || '',
          });
        }
      });

      // Map Expenses -> Payables
      const mappedPayables: Payable[] = expensesRows.map((p: any) => ({
        id: p.id,
        description: p.description || 'Despesa',
        category: p.category || 'Outros',
        supplier: p.supplier || '',
        amount: Number(p.amount) || 0,
        dueDate: p.due_date || new Date().toISOString().split('T')[0],
        paymentDate: p.payment_date || undefined,
        paymentMethod: (p.payment_method as any) || 'Pix',
        accountId: p.source_account_id || 'acc-1',
        isRecurring: Boolean(p.is_recurring),
        status: (p.status as any) || 'Pendente',
        notes: p.notes || '',
        createdAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));

      // Map Financial Accounts
      const mappedAccounts: FinancialAccount[] =
        accountsRows.length > 0
          ? accountsRows.map((a: any) => ({
              id: a.id,
              name: a.name || 'Conta',
              type: (a.account_type as any) || 'bank',
              balance: Number(a.current_balance) || 0,
              initialBalance: Number(a.initial_balance) || 0,
              color: a.id === 'acc-1' ? '#ff7a00' : a.id === 'acc-2' ? '#00d632' : '#0a84ff',
              isActive: a.is_active ?? true,
            }))
          : initialSystemData.financialAccounts;

      // Map Company Settings
      let mappedSettings = initialSystemData.settings;
      if (settingsRows.length > 0) {
        const s = settingsRows[0];
        mappedSettings = {
          ...mappedSettings,
          companyName: s.company_name || mappedSettings.companyName,
          agencyName: s.agency_name || mappedSettings.agencyName,
          ownerName: s.owner_name || mappedSettings.ownerName,
          userName: s.user_name || mappedSettings.userName,
          userRole: s.user_role || mappedSettings.userRole,
          userEmail: s.user_email || mappedSettings.userEmail,
          userAvatarUrl: s.user_avatar_url || mappedSettings.userAvatarUrl,
          cnpj: s.cnpj || mappedSettings.cnpj,
          document: s.cnpj || mappedSettings.document,
          defaultPixKey: s.default_pix_key || mappedSettings.defaultPixKey,
          defaultTaxRate: Number(s.default_tax_rate) || mappedSettings.defaultTaxRate,
          defaultInfinitePayRate: Number(s.default_infinite_pay_rate) || mappedSettings.defaultInfinitePayRate,
          defaultProLaboreMonthly:
            Number(s.default_pro_labore_monthly) || mappedSettings.defaultProLaboreMonthly,
          lockPin: s.lock_pin || mappedSettings.lockPin,
          isLocked: Boolean(s.is_locked),
        };
      }

      // Assemble full SystemData
      const completeData: SystemData = {
        settings: mappedSettings,
        goals: backupData?.goals || initialSystemData.goals,
        services: backupData?.services || initialSystemData.services,
        financialAccounts: mappedAccounts,
        categories: backupData?.categories || initialSystemData.categories,
        clients: mappedClients,
        projects: mappedProjects,
        subscriptions: mappedSubscriptions,
        receivables: mappedReceivables,
        payables: mappedPayables,
        transfers: backupData?.transfers || [],
        reserves: backupData?.reserves || [],
        proLabore: backupData?.proLabore || [],
        referrals: backupData?.referrals || [],
        marketingCampaigns: backupData?.marketingCampaigns || [],
        auditLogs: backupData?.auditLogs || [],
      };

      // Keep backup updated in background
      void Promise.resolve(
        supabase.from('app_state_backup').upsert({
          id: 'latest',
          data: completeData,
          updated_at: new Date().toISOString(),
        })
      );

      return {
        success: true,
        data: completeData,
        message: `${mappedClients.length} clientes, ${mappedReceivables.length} recebíveis e ${mappedPayables.length} despesas sincronizados com o Supabase!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro ao puxar dados do Supabase',
      };
    }
  },

  /**
   * Subscribe to real-time changes on Supabase database
   */
  subscribeToRealtimeChanges(onChange: () => void) {
    try {
      const channel = supabase
        .channel('paradiso-db-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            // Ignore internal app_state_backup changes to prevent loops
            if (payload.table !== 'app_state_backup') {
              onChange();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime channel error:', err);
      return () => {};
    }
  },

  /**
   * Save individual client to Supabase
   */
  async syncClient(client: Client): Promise<void> {
    try {
      await supabase.from('clients').upsert({
        id: client.id,
        company_name: client.companyName,
        contact_name: client.contactName,
        document: client.document,
        phone: client.phone,
        whatsapp: client.whatsapp,
        email: client.email,
        city: client.city,
        state: client.state,
        address: client.address,
        status: client.status,
        origin: client.origin,
        notes: client.notes,
        avatar_url: client.avatarUrl,
        instagram: client.instagram,
        current_website: client.currentWebsite,
        is_recurring: client.isRecurring,
        created_at: client.createdAt,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // silent fallback
    }
  },

  /**
   * Delete client and all related records from Supabase
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      await supabase.from('receivables').delete().eq('client_id', clientId);
      await supabase.from('contracts').delete().eq('client_id', clientId);
      await supabase.from('proposals').delete().eq('client_id', clientId);
      await supabase.from('clients').delete().eq('id', clientId);
    } catch {
      // silent fallback
    }
  },

  /**
   * Delete a receivable record directly from Supabase
   */
  async deleteReceivable(receivableId: string): Promise<void> {
    try {
      await supabase.from('receivables').delete().eq('id', receivableId);
    } catch {
      // silent fallback
    }
  },

  /**
   * Delete a payable / expense record directly from Supabase
   */
  async deletePayable(payableId: string): Promise<void> {
    try {
      await supabase.from('expenses').delete().eq('id', payableId);
    } catch {
      // silent fallback
    }
  },

  /**
   * Clears sample/demo records from Supabase database tables to start fresh from zero
   */
  async clearAllDataFromSupabase(): Promise<{ success: boolean; message: string }> {
    const cleared: string[] = [];
    try {
      // Clear dependent transaction tables first
      await supabase.from('receivables').delete().neq('id', '___keep_none___');
      cleared.push('receivables');
      await supabase.from('contracts').delete().neq('id', '___keep_none___');
      cleared.push('contracts');
      await supabase.from('expenses').delete().neq('id', '___keep_none___');
      cleared.push('expenses');
      await supabase.from('tasks').delete().neq('id', '___keep_none___');
      cleared.push('tasks');
      await supabase.from('leads').delete().neq('id', '___keep_none___');
      cleared.push('leads');
      await supabase.from('proposals').delete().neq('id', '___keep_none___');
      cleared.push('proposals');
      await supabase.from('clients').delete().neq('id', '___keep_none___');
      cleared.push('clients');
      
      // Update app_state_backup to empty state
      await supabase.from('app_state_backup').delete().neq('id', '___keep_none___');
      cleared.push('app_state_backup');

      return {
        success: true,
        message: 'Todas as tabelas foram zeradas com sucesso no banco de dados Supabase! Base pronta para uso.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Falha ao limpar tabelas do Supabase.',
      };
    }
  },
};
