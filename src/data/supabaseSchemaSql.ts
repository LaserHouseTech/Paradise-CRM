export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- PARADISO CRM & GESTÃO FINANCEIRA - SUPABASE DATABASE SCHEMA
-- Projeto: uzidzjkolebplnyipwlz.supabase.co
-- Data de Criação: 2026-09-11
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/uzidzjkolebplnyipwlz/sql/new)
-- ==============================================================================

-- 1. EXTENSÕES ÚTEIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'Cliente ativo',
  origin TEXT DEFAULT 'Prospecção ativa',
  notes TEXT,
  avatar_url TEXT,
  instagram TEXT,
  current_website TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: CONTRATOS
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_number TEXT,
  title TEXT NOT NULL,
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  monthly_value NUMERIC(12, 2) DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Ativo',
  services JSONB DEFAULT '[]'::jsonb,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: RECEBÍVEIS / COBRANÇAS
CREATE TABLE IF NOT EXISTS public.receivables (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_id TEXT,
  description TEXT NOT NULL,
  gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  net_amount NUMERIC(12, 2) DEFAULT 0.00,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_method TEXT,
  destination_account_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA: DESPESAS / CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente',
  payment_method TEXT,
  source_account_id TEXT,
  is_recurring BOOLEAN DEFAULT false,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA: LEADS / FUNIL COMERCIAL
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'Novo',
  value NUMERIC(12, 2) DEFAULT 0.00,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA: PROPOSTAS
CREATE TABLE IF NOT EXISTS public.proposals (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  title TEXT NOT NULL,
  total_value NUMERIC(12, 2) DEFAULT 0.00,
  status TEXT DEFAULT 'Enviada',
  valid_until DATE,
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABELA: TAREFAS OPERACIONAIS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'Média',
  status TEXT DEFAULT 'Pendente',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABELA: CONTAS BANCÁRIAS E FINANCEIRAS
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  initial_balance NUMERIC(12, 2) DEFAULT 0.00,
  current_balance NUMERIC(12, 2) DEFAULT 0.00,
  account_type TEXT DEFAULT 'Conta Corrente',
  is_active BOOLEAN DEFAULT true
);

-- 10. TABELA: CONFIGURAÇÕES DA EMPRESA E PERFIL DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT,
  agency_name TEXT,
  owner_name TEXT,
  user_name TEXT,
  user_role TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  cnpj TEXT,
  default_pix_key TEXT,
  default_tax_rate NUMERIC(5, 2) DEFAULT 6.00,
  default_infinite_pay_rate NUMERIC(5, 2) DEFAULT 2.99,
  default_pro_labore_monthly NUMERIC(12, 2) DEFAULT 3500.00,
  lock_pin TEXT DEFAULT '1234',
  is_locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABELA: BACKUP DE ESTADO COMPLETO DO SISTEMA
CREATE TABLE IF NOT EXISTS public.app_state_backup (
  id TEXT PRIMARY KEY DEFAULT 'latest',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 12. HABILITAÇÃO DE ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state_backup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_clients" ON public.clients;
CREATE POLICY "allow_all_clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_contracts" ON public.contracts;
CREATE POLICY "allow_all_contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_receivables" ON public.receivables;
CREATE POLICY "allow_all_receivables" ON public.receivables FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_expenses" ON public.expenses;
CREATE POLICY "allow_all_expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_leads" ON public.leads;
CREATE POLICY "allow_all_leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_proposals" ON public.proposals;
CREATE POLICY "allow_all_proposals" ON public.proposals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tasks" ON public.tasks;
CREATE POLICY "allow_all_tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_accounts" ON public.financial_accounts;
CREATE POLICY "allow_all_accounts" ON public.financial_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_settings" ON public.company_settings;
CREATE POLICY "allow_all_settings" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_backup" ON public.app_state_backup;
CREATE POLICY "allow_all_backup" ON public.app_state_backup FOR ALL USING (true) WITH CHECK (true);

-- 13. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_receivables_client ON public.receivables(client_id);
CREATE INDEX IF NOT EXISTS idx_receivables_due ON public.receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_due ON public.expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON public.contracts(client_id);
`;
