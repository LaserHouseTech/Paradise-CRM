import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { SUPABASE_SCHEMA_SQL } from '../../data/supabaseSchemaSql';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase';
import {
  Settings,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Lock,
  KeyRound,
  FileText,
  Clock,
  CheckCircle2,
  Building,
  DollarSign,
  Percent,
  User,
  Camera,
  Trash2,
  Check,
  RotateCcw,
  Database,
  ExternalLink,
  Copy,
  CheckCheck,
  Cloud,
  Server,
  Code,
  AlertCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    data,
    updateSettings,
    exportBackupJSON,
    importBackupJSON,
    resetToDemoData,
    clearDatabaseAndStartFresh,
    lockApp,
    unlockApp,
    supabaseSyncState,
    lastSupabaseSyncTime,
    supabaseSyncMessage,
    isSupabaseAutoSyncEnabled,
    setIsSupabaseAutoSyncEnabled,
    forceSyncSupabase,
    pullFromSupabase,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'perfil' | 'supabase' | 'geral' | 'backup' | 'seguranca' | 'auditoria'>('perfil');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Supabase states
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [clearingDatabase, setClearingDatabase] = useState(false);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    tested: boolean;
    connected: boolean;
    tablesFound: string[];
    missingTables: string[];
    error?: string;
  } | null>(null);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showSqlCode, setShowSqlCode] = useState(false);

  useEffect(() => {
    const handleOpenTab = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail === 'supabase') {
        setActiveTab('supabase');
      }
    };
    window.addEventListener('open-settings-tab', handleOpenTab);
    return () => window.removeEventListener('open-settings-tab', handleOpenTab);
  }, []);

  // User Profile form states
  const [userName, setUserName] = useState(data.settings.userName || data.settings.ownerName || 'Luís Santos (CEO)');
  const [userRole, setUserRole] = useState(data.settings.userRole || 'CEO');
  const [userEmail, setUserEmail] = useState(data.settings.userEmail || 'laserhouse.tech@gmail.com');
  const [userAvatarUrl, setUserAvatarUrl] = useState(data.settings.userAvatarUrl || '/user_avatar.svg');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Settings form states
  const [agencyName, setAgencyName] = useState(data.settings.agencyName);
  const [ownerName, setOwnerName] = useState(data.settings.ownerName);
  const [cnpj, setCnpj] = useState(data.settings.cnpj);
  const [pixKey, setPixKey] = useState(data.settings.defaultPixKey);
  const [taxRate, setTaxRate] = useState(data.settings.defaultTaxRate.toString());
  const [infinitePayRate, setInfinitePayRate] = useState(data.settings.defaultInfinitePayRate.toString());
  const [proLabore, setProLabore] = useState(data.settings.defaultProLaboreMonthly.toString());

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName,
      ownerName: userName,
      userRole,
      userEmail,
      userAvatarUrl,
    });
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setUserAvatarUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      agencyName,
      ownerName,
      cnpj,
      defaultPixKey: pixKey,
      defaultTaxRate: parseFloat(taxRate) || 6,
      defaultInfinitePayRate: parseFloat(infinitePayRate) || 2.99,
      defaultProLaboreMonthly: parseFloat(proLabore) || 3500,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    updateSettings({ accessPassword: newPassword });
    setNewPassword('');
    alert('Senha de acesso local atualizada com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJSON(content);
      }
    };
    reader.readAsText(file);
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseMessage(null);
    try {
      const status = await supabaseSyncService.checkStatus();
      setSupabaseTestStatus({
        tested: true,
        connected: status.connected,
        tablesFound: status.tablesFound,
        missingTables: status.missingTables,
        error: status.error,
      });
      if (status.connected) {
        if (status.tablesFound.length > 0) {
          setSupabaseMessage({
            type: 'success',
            text: `Conexão ativa! ${status.tablesFound.length} tabela(s) sincronizada(s) no Supabase.`,
          });
        } else {
          setSupabaseMessage({
            type: 'info',
            text: 'Conexão com a infraestrutura Supabase estabelecida com sucesso! Execute o script SQL no Supabase para inicializar as tabelas.',
          });
        }
      } else {
        setSupabaseMessage({
          type: 'error',
          text: status.error || 'Falha ao conectar com o Supabase.',
        });
      }
    } catch (err: any) {
      setSupabaseMessage({
        type: 'error',
        text: err.message || 'Erro inesperado ao testar conexão.',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handlePushToSupabase = async () => {
    setSyncingSupabase(true);
    setSupabaseMessage(null);
    try {
      await forceSyncSupabase();
      setSupabaseMessage({
        type: 'success',
        text: 'Dados locais enviados e sincronizados com o Supabase com sucesso!',
      });
    } catch (err: any) {
      setSupabaseMessage({
        type: 'error',
        text: err.message || 'Erro ao sincronizar dados.',
      });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setSyncingSupabase(true);
    setSupabaseMessage(null);
    try {
      const ok = await pullFromSupabase();
      if (ok) {
        setSupabaseMessage({
          type: 'success',
          text: 'Dados puxados do Supabase e atualizados na plataforma com sucesso!',
        });
      } else {
        setSupabaseMessage({
          type: 'error',
          text: supabaseSyncMessage || 'Nenhum dado retornado do banco Supabase.',
        });
      }
    } catch (err: any) {
      setSupabaseMessage({
        type: 'error',
        text: err.message || 'Erro ao puxar dados do Supabase.',
      });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleClearDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá zerar todas as tabelas no Supabase e no armazenamento local (clientes, contratos, faturas, despesas e tarefas) para iniciar a base de clientes do zero absoluto.\n\nDeseja continuar e zerar toda a base agora?'
    );
    if (!confirmed) return;

    setClearingDatabase(true);
    setSupabaseMessage(null);
    try {
      if (clearDatabaseAndStartFresh) {
        const res = await clearDatabaseAndStartFresh();
        setSupabaseMessage({
          type: res.success ? 'success' : 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setSupabaseMessage({
        type: 'error',
        text: err.message || 'Erro ao zerar banco de dados.',
      });
    } finally {
      setClearingDatabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  return (
    <div id="settings-module" className="space-y-6 pb-12">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#13141a] border border-white/[0.08] w-fit flex-wrap">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'perfil' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Meu Perfil & Foto</span>
        </button>

        <button
          id="tab-supabase-btn"
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'supabase'
              ? 'bg-emerald-500 text-neutral-950 font-semibold shadow'
              : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Banco de Dados (Supabase)</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'geral' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Dados da Agência</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'backup' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup & Restauração</span>
        </button>

        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'seguranca' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Segurança & Senha</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === 'auditoria' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Logs de Auditoria</span>
        </button>
      </div>

      {/* TAB 0: MEU PERFIL & FOTO */}
      {activeTab === 'perfil' && (
        <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Meu Perfil de Administrador</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Personalize seu nome, cargo e sua foto de perfil (exibida no cabeçalho e na barra lateral).
            </p>
          </div>

          {profileSaveSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Perfil e foto de perfil atualizados com sucesso!</span>
            </div>
          )}

          {/* User Avatar Section */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <label className="block text-xs font-semibold text-white">Foto de Perfil Pessoal</label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative group shrink-0">
                <img
                  src={userAvatarUrl || '/user_avatar.svg'}
                  alt="Minha Foto de Perfil"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 shadow-xl bg-neutral-900"
                />
                <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md ring-2 ring-[#0a0b12]">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-xs font-medium text-white">
                    {userAvatarUrl === '/user_avatar.svg' ? (
                      <span className="text-blue-400 font-semibold">✓ Foto de perfil anexada ativa (Laser House Tech / Logo Google)</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">✓ Foto personalizada ativa</span>
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Formatos recomendados: PNG, JPG ou SVG. Resolução quadrada (ex: 400x400).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Nova Foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserAvatarUrl('/user_avatar.svg')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-medium transition"
                    title="Restaurar para a foto anexada"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Restaurar Foto Anexada</span>
                  </button>
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="Ou cole a URL direta de uma imagem na web..."
                    value={userAvatarUrl.startsWith('data:') ? '' : userAvatarUrl}
                    onChange={(e) => setUserAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Seu Nome Completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Luís Santos (CEO)"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="Ex: CEO"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail de Notificações / Acesso</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="admin@laserhousetech.com.br"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-semibold hover:bg-neutral-200 transition shadow"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Dados do Perfil</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: BANCO DE DADOS SUPABASE */}
      {activeTab === 'supabase' && (
        <div className="space-y-6 max-w-3xl">
          {/* Header & Status Card */}
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Banco de Dados Supabase (PostgreSQL)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Conectado
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Infraestrutura em nuvem integrada para armazenamento de alta performance e sincronização instantânea.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://supabase.com/dashboard/project/uzidzjkolebplnyipwlz"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-neutral-300 hover:text-white text-xs font-medium transition"
                >
                  <span>Dashboard Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Notification alert */}
            {supabaseMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  supabaseMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : supabaseMessage.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                }`}
              >
                {supabaseMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-medium">{supabaseMessage.text}</p>
                </div>
              </div>
            )}

            {/* Connection Credentials Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-400">SUPABASE_URL</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_URL);
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white truncate select-all bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                  {SUPABASE_URL}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-400">PUBLISHABLE KEY (ANON)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_ANON_KEY);
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white truncate select-all bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                  {SUPABASE_ANON_KEY.substring(0, 16)}••••••••••••••••••••••••••
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <button
                id="test-supabase-connection-btn"
                onClick={handleTestSupabase}
                disabled={testingSupabase}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                <span>{testingSupabase ? 'Verificando Conexão...' : 'Testar Conexão & Tabelas'}</span>
              </button>

              {supabaseTestStatus?.tested && (
                <div className="text-xs text-neutral-400 flex items-center gap-2">
                  <span>Status:</span>
                  {supabaseTestStatus.connected ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ativo ({supabaseTestStatus.tablesFound.length} tabelas detectadas)
                    </span>
                  ) : (
                    <span className="text-red-400 font-medium">Erro ao conectar</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Auto-Save Nuvem Toggle Card */}
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Atualização Automática no Supabase (Auto-Save Nuvem)
                  </h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      !isSupabaseAutoSyncEnabled
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        : supabaseSyncState === 'syncing'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                        : supabaseSyncState === 'synced'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {!isSupabaseAutoSyncEnabled
                      ? 'PAUSADO'
                      : supabaseSyncState === 'syncing'
                      ? 'SALVANDO...'
                      : supabaseSyncState === 'synced'
                      ? 'ATIVO & SINCRONIZADO'
                      : 'AGUARDANDO SQL'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  A cada dado alterado (cadastro de cliente, exclusão, edição de projeto, pagamento recebido ou despesa), o sistema envia automaticamente a atualização para o banco de dados Supabase em segundo plano.
                </p>
                {lastSupabaseSyncTime && (
                  <p className="text-[11px] text-emerald-400/80 pt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Último salvamento automático realizado em {lastSupabaseSyncTime.toLocaleTimeString()}</span>
                  </p>
                )}
              </div>

              {/* Toggle switch */}
              <div className="flex items-center gap-3 shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggle-supabase-autosync"
                    checked={isSupabaseAutoSyncEnabled}
                    onChange={(e) => setIsSupabaseAutoSyncEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Table-by-Table Status & Sync Card */}
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Status das 10 Tabelas do Banco de Dados</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Verificação em tempo real de cada tabela mapeada no Supabase e quantidade de registros prontos para sincronização.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="sync-all-tables-btn"
                  onClick={handlePushToSupabase}
                  disabled={syncingSupabase}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
                  <span>{syncingSupabase ? 'Atualizando Tabelas...' : 'Atualizar Todas as Tabelas Agora'}</span>
                </button>
              </div>
            </div>

            {/* 10 Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
              {[
                { name: 'clients', label: 'Clientes Cadastrados', count: data.clients.length },
                { name: 'contracts', label: 'Contratos & Assinaturas', count: data.projects.length + data.subscriptions.length },
                { name: 'receivables', label: 'Contas a Receber', count: data.receivables.length },
                { name: 'expenses', label: 'Despesas Operacionais', count: data.payables.length },
                {
                  name: 'leads',
                  label: 'Leads & Funil',
                  count: data.clients.filter((c) => c.status === 'Lead' || c.status === 'Em negociação' || Boolean(c.pipelineStage)).length,
                },
                { name: 'tasks', label: 'Tarefas de Entrega', count: data.projects.length },
                { name: 'financial_accounts', label: 'Contas Bancárias', count: data.financialAccounts?.length || 0 },
                { name: 'company_settings', label: 'Configurações da Empresa', count: 1 },
                { name: 'proposals', label: 'Propostas Comerciais', count: 0 },
                { name: 'app_state_backup', label: 'Snapshot Integral (Backup)', count: 1 },
              ].map((table) => {
                const isFound = supabaseTestStatus?.tablesFound?.includes(table.name);
                const isMissing = supabaseTestStatus?.missingTables?.includes(table.name);

                return (
                  <div
                    key={table.name}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-white">{table.name}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">{table.label}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-[11px] font-mono font-bold text-neutral-200 bg-white/[0.05] px-2 py-0.5 rounded">
                        {table.count} {table.count === 1 ? 'item' : 'itens'}
                      </span>
                      {supabaseTestStatus?.tested && (
                        <div className="text-[10px] mt-0.5">
                          {isFound ? (
                            <span className="text-emerald-400 font-medium">✓ Ativa</span>
                          ) : isMissing ? (
                            <span className="text-amber-400 font-medium">Pendente SQL</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync Actions Card */}
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Sincronização Manual & Restauração</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Envie seus dados manualmente ou recupere o último snapshot salvo na nuvem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                id="push-to-supabase-btn"
                onClick={handlePushToSupabase}
                disabled={syncingSupabase}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition text-left space-y-2 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <Cloud className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    LOCAL → NUVEM
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                    Forçar Envio para o Supabase
                  </h5>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Grava todos os {data.clients.length} clientes e lançamentos atuais no banco de dados Supabase.
                  </p>
                </div>
              </button>

              <button
                id="pull-from-supabase-btn"
                onClick={handlePullFromSupabase}
                disabled={syncingSupabase}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition text-left space-y-2 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <Download className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    NUVEM → LOCAL
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-blue-300 transition">
                    Puxar Dados do Supabase
                  </h5>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Recupera o último snapshot salvo na nuvem e atualiza a interface instantaneamente.
                  </p>
                </div>
              </button>

              <button
                id="clear-all-supabase-btn"
                onClick={handleClearDatabase}
                disabled={clearingDatabase || syncingSupabase}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition text-left space-y-2 group disabled:opacity-50 sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <Trash2 className="w-5 h-5 text-red-400 group-hover:scale-110 transition" />
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                    ZERAR BASE • PRODUÇÃO LIMPA
                  </span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-red-300 transition">
                    {clearingDatabase ? 'Zerando tabelas no Supabase...' : 'Zerar Banco de Dados e Iniciar do Zero'}
                  </h5>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Remove registros de exemplo em todas as 10 tabelas e reinicia o CRM com a base de clientes do zero absoluto.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Database Schema Setup Guide */}
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Estrutura de Tabelas & Script SQL</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Execute o script abaixo no SQL Editor do Supabase para criar as 10 tabelas com índices e RLS.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="copy-sql-schema-btn"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 text-xs font-semibold transition shadow-sm"
                >
                  {sqlCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{sqlCopied ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/uzidzjkolebplnyipwlz/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition"
                >
                  <span>Abrir SQL Editor</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-emerald-400">Passo 1</div>
                <p className="text-[11px] text-neutral-300">
                  Clique no botão verde acima para copiar o script SQL completo.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-blue-400">Passo 2</div>
                <p className="text-[11px] text-neutral-300">
                  Abra o SQL Editor no painel do Supabase com o link direto ao lado.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-xs font-bold text-amber-400">Passo 3</div>
                <p className="text-[11px] text-neutral-300">
                  Cole o código e clique em "Run". Todas as tabelas estarão prontas!
                </p>
              </div>
            </div>

            {/* Toggle SQL preview */}
            <div className="pt-2">
              <button
                onClick={() => setShowSqlCode(!showSqlCode)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showSqlCode ? 'Ocultar código SQL' : 'Visualizar código SQL completo (supabase_schema.sql)'}</span>
              </button>

              {showSqlCode && (
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-white/10 max-h-72 overflow-y-auto font-mono text-[11px] text-neutral-300 space-y-1 select-all">
                  <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: GERAL */}
      {activeTab === 'geral' && (
        <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Parâmetros Operacionais da Paradiso</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Configure alíquotas de imposto, taxas e chaves Pix de cobrança.
            </p>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Proprietário</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Chave Pix de Cobrança</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/[0.04]">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Alíquota de Imposto (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Ex: 6.0% Simples Nacional</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Taxa InfinitePay Média (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={infinitePayRate}
                  onChange={(e) => setInfinitePayRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Ex: 2.99% à vista/parcelado</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Meta Pró-labore (R$)</label>
                <input
                  type="number"
                  step="100"
                  value={proLabore}
                  onChange={(e) => setProLabore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                />
                <span className="text-[10px] text-neutral-500">Teto mensal sócio</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition"
              >
                Salvar Configurações
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-4 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Exportação e Segurança dos Dados Locais</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Todos os seus clientes, contratos, projetos e finanças estão salvos no seu navegador local.
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              Último backup: {data.settings.lastBackupDate ? formatDate(data.settings.lastBackupDate) : 'Nenhum backup recente'}. Recomenda-se exportar semanalmente.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={exportBackupJSON}
                className="p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-mono text-neutral-400">JSON</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                    Exportar Backup Completo
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Baixa um arquivo .json seguro com todos os registros da agência.
                  </p>
                </div>
              </button>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition text-left space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <Upload className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-mono text-neutral-400">RESTORE</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                    Restaurar a Partir de Backup
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Carregue um arquivo JSON gerado anteriormente para restaurar a base.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
              <button
                id="clear-all-data-backup-tab-btn"
                onClick={handleClearDatabase}
                disabled={clearingDatabase}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearingDatabase ? 'Zerando base...' : 'Zerar Tudo & Começar do Zero (Limpar Supabase + Local)'}</span>
              </button>

              <button
                onClick={resetToDemoData}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium border border-white/10 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Recarregar Dados de Demonstração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEGURANÇA */}
      {activeTab === 'seguranca' && (
        <div className="p-6 rounded-2xl bg-[#13141a] border border-white/[0.08] max-w-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Controle de Acesso & Bloqueio Local</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Proteja as informações financeiras da Paradiso de olhares curiosos.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div>
              <h4 className="text-xs font-semibold text-white">Bloqueio Imediato da Aplicação</h4>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Exige a senha mestre (padrão: 1234) para liberar as telas.
              </p>
            </div>
            <button
              onClick={lockApp}
              className="px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Agora</span>
            </button>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Alterar Senha Mestre de Desbloqueio
              </label>
              <input
                type="password"
                placeholder="Digite a nova senha..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition"
            >
              Atualizar Senha
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AUDITORIA */}
      {activeTab === 'auditoria' && (
        <div className="rounded-2xl bg-[#13141a] border border-white/[0.08] overflow-hidden">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Logs de Auditoria do Sistema</h3>
              <p className="text-xs text-neutral-400">
                Registro cronológico inalterável de todas as modificações operacionais
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              {data.auditLogs.length} eventos registrados
            </span>
          </div>

          <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-white/[0.01] transition flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 font-semibold text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-white font-medium">{log.details}</span>
                  </div>
                  <p className="text-neutral-500 text-[10px]">
                    Usuário: {log.userName}
                  </p>
                </div>

                <span className="text-neutral-400 font-mono text-[11px]">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
