import React, { useState, useEffect } from 'react';
import { ExternalApiResponse, ExternalUserProfile, User } from '../types';
import { api } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/Toast';
import {
  Globe2,
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  Building,
  Mail,
  Phone,
  Code,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface ExternalApiViewProps {
  onUserImported: (user: User) => void;
}

export const ExternalApiView: React.FC<ExternalApiViewProps> = ({ onUserImported }) => {
  const { success, error: showError } = useToast();
  const [data, setData] = useState<ExternalApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [importingId, setImportingId] = useState<number | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchExternalData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const res = await api.getExternalUsers(forceRefresh);
      setData(res);
      if (forceRefresh) {
        success('External API cache refreshed successfully');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to connect to external API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExternalData();
  }, []);

  const handleImport = async (user: ExternalUserProfile) => {
    setImportingId(user.id);
    try {
      const imported = await api.importExternalUser({
        name: user.name,
        email: user.email,
        role: user.suggestedRole,
        avatar: user.avatar,
      });

      success(`Imported "${imported.name}" as ${imported.role}`);
      onUserImported(imported);

      // Mark locally as imported
      if (data) {
        setData({
          ...data,
          data: data.data.map((u) => (u.id === user.id ? { ...u, isImported: true } : u)),
        });
      }
    } catch (err: any) {
      showError(err.message || 'Failed to import user');
    } finally {
      setImportingId(null);
    }
  };

  const filteredUsers = (data?.data || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company.name.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              External API Directory Integration
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active REST Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Consumes public external REST endpoint <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">GET /api/external/users</code> with rate-limiting & timeout resilience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Code className="w-3.5 h-3.5" />}
            onClick={() => setShowRawJson(!showRawJson)}
          >
            {showRawJson ? 'Hide Raw JSON' : 'Inspect JSON Payload'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />}
            onClick={() => fetchExternalData(true)}
            disabled={isLoading}
          >
            Force API Refresh
          </Button>
        </div>
      </div>

      {/* Telemetry & Architecture Spec Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Response Latency</p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {data ? `${data.latencyMs} ms` : '—'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Rate Limit Status</p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {data ? `${data.rateLimit.remaining} / ${data.rateLimit.limit}` : '—'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <Globe2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Data Source</p>
            <p className="text-xs font-bold text-slate-900 truncate">
              {data?.source || 'Public REST API'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Cache TTL Remaining</p>
            <p className="text-lg font-bold text-slate-900 font-mono">
              {data ? `${data.rateLimit.resetInSeconds}s` : '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* Raw JSON Viewer */}
      {showRawJson && data && (
        <Card className="bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-80">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>JSON Response Payload</span>
            <span>{data.data.length} records</span>
          </div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search external directory by name, email, company, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredUsers.length} external candidates
        </span>
      </div>

      {/* Users Grid */}
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Connecting to external REST API...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{user.name}</h4>
                      <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-0.5">
                        {user.suggestedRole}
                      </span>
                    </div>
                  </div>

                  {user.isImported ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Team Member
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.company.name} ({user.department})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                {user.isImported ? (
                  <Button variant="outline" size="sm" disabled className="w-full text-xs">
                    Already in Team Directory
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => handleImport(user)}
                    isLoading={importingId === user.id}
                    className="w-full text-xs"
                  >
                    Import into Team
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
