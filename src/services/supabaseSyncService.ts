import { supabase, checkSupabaseHealth, SupabaseHealthStatus } from '../lib/supabase';
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
          created_at: c.createdAt,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('clients').upsert(payload);
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
  async pullDataFromSupabase(): Promise<{ success: boolean; data?: Partial<SystemData>; message: string }> {
    try {
      // First check if app_state_backup exists
      const { data: backupRow, error: backupErr } = await supabase
        .from('app_state_backup')
        .select('data')
        .eq('id', 'latest')
        .single();

      if (!backupErr && backupRow && backupRow.data) {
        return {
          success: true,
          data: backupRow.data as SystemData,
          message: 'Dados recuperados com sucesso do backup do Supabase!',
        };
      }

      // Otherwise try loading from individual tables
      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData && clientsData.length > 0) {
        const loadedClients: Client[] = clientsData.map((c: any) => ({
          id: c.id,
          companyName: c.company_name,
          contactName: c.contact_name,
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
          avatarUrl: c.avatar_url,
          instagram: c.instagram,
          currentWebsite: c.current_website,
          isRecurring: c.is_recurring,
          createdAt: c.created_at,
        }));

        return {
          success: true,
          data: { clients: loadedClients },
          message: `${loadedClients.length} clientes carregados do Supabase!`,
        };
      }

      return {
        success: false,
        message: 'Nenhum dado encontrado no Supabase ainda.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro ao puxar dados do Supabase',
      };
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
