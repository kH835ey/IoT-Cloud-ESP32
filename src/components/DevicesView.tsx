import React, { useState, useMemo } from 'react';
import { IoTDevice } from '../types';
import {
  Box,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Search,
  ChevronDown,
  MoreVertical,
  QrCode,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Clock,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Cpu,
  Wifi,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DevicesViewProps {
  devices: IoTDevice[];
  activeDevice: IoTDevice | null;
  onSelectDevice: (dev: IoTDevice) => void;
  onRegenerateToken: (deviceId: string) => void;
  onOpenNewDeviceModal: () => void;
  onOpenQr: (dev: IoTDevice) => void;
  onNavigateToDashboard?: (dev: IoTDevice) => void;
  lang: 'km' | 'en';
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onRegenerateToken,
  onOpenNewDeviceModal,
  onOpenQr,
  onNavigateToDashboard,
  lang,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Extract unique organizations
  const organizations = useMemo(() => {
    const orgs = Array.from(new Set(devices.map(d => d.orgId)));
    return orgs;
  }, [devices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      const matchSearch =
        dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.nameKhmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.authToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.templateId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchOrg = selectedOrg === 'all' || dev.orgId === selectedOrg;
      return matchSearch && matchOrg;
    });
  }, [devices, searchQuery, selectedOrg]);

  const copyToken = (token: string, devId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedId(devId);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.2 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRevealToken = (devId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedTokens(prev => ({ ...prev, [devId]: !prev[devId] }));
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map(d => d.id));
    }
  };

  const toggleSelectDevice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleRowClick = (dev: IoTDevice) => {
    onSelectDevice(dev);
    if (onNavigateToDashboard) {
      onNavigateToDashboard(dev);
    }
  };

  return (
    <div id="devices-management-view" className="space-y-4">
      {/* Top Breadcrumb & Actions Bar (Blynk Style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Organization Dropdown & Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Org Selector */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-white shadow-inner">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <select
                id="devices-org-filter-select"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                aria-label="Filter by Organization"
              >
                <option value="all" className="bg-slate-900 text-white">All Organizations (ទាំងអស់)</option>
                {organizations.map(org => (
                  <option key={org} value={org} className="bg-slate-900 text-white">
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="filter-tab-all"
              onClick={() => setFilterTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                filterTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{lang === 'km' ? 'ទាំងអស់' : 'All'} {devices.length}</span>
              <span className="text-[10px] text-emerald-400 font-mono">•••</span>
            </button>
            <button
              id="filter-tab-my"
              onClick={() => setFilterTab('my')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                filterTab === 'my'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3 text-slate-400" />
              <span>{lang === 'km' ? 'ឧបករណ៍របស់ខ្ញុំ' : 'My devices'}</span>
            </button>
          </div>
        </div>

        {/* Right: Search, View Mode & + New Device button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-device-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកតាមឈ្មោះ ឬ Token...' : 'Search by name, ID, or token...'}
              className="w-full bg-slate-950 text-xs text-white pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Toggle View Mode (Table / Grid) */}
          <div className="inline-flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              id="view-mode-table-btn"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View (Blynk Style)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              id="view-mode-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* + New Device Button */}
          <button
            id="add-new-device-main-btn"
            onClick={onOpenNewDeviceModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'km' ? '+ ឧបករណ៍ថ្មី' : '+ New Device'}</span>
          </button>
        </div>
      </div>

      {/* Bulk action ribbon if items selected */}
      {selectedDeviceIds.length > 0 && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold">{selectedDeviceIds.length}</span>
            <span>{lang === 'km' ? 'ឧបករណ៍ត្រូវបានជ្រើសរើស' : 'devices selected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDeviceIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              {lang === 'km' ? 'បោះបង់' : 'Deselect All'}
            </button>
          </div>
        </div>
      )}

      {/* TABLE VIEW (Exact Blynk.Console UI Layout - Image 5) */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-white transition flex items-center"
                      title="Select All"
                    >
                      {selectedDeviceIds.length === filteredDevices.length && filteredDevices.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">{lang === 'km' ? 'ឈ្មោះឧបករណ៍ (Name)' : 'Name'}</th>
                  <th className="py-3 px-4">{lang === 'km' ? 'Auth Token' : 'Auth Token'}</th>
                  <th className="py-3 px-4">{lang === 'km' ? 'ម្ចាស់ឧបករណ៍ (Owner)' : 'Owner'}</th>
                  <th className="py-3 px-4">{lang === 'km' ? 'ស្ថានភាព (Status)' : 'Status'}</th>
                  <th className="py-3 px-4">{lang === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាព' : 'Last updated'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDevices.map(dev => {
                  const isSelected = selectedDeviceIds.includes(dev.id);
                  const isViewing = activeDevice?.id === dev.id;
                  const isRevealed = Boolean(revealedTokens[dev.id]);
                  const maskedToken = isRevealed
                    ? dev.authToken
                    : `${dev.authToken.substring(0, 8)}••••••••••••${dev.authToken.slice(-4)}`;

                  return (
                    <tr
                      key={dev.id}
                      id={`device-row-${dev.id}`}
                      onClick={() => handleRowClick(dev)}
                      className={`cursor-pointer transition-all duration-150 group ${
                        isViewing
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => toggleSelectDevice(dev.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </td>

                      {/* Name with Green 3D Cube Icon (Blynk trademark) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Green Cube Icon (as seen in screenshots) */}
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-emerald-400/60 transition shadow-sm">
                            <Box className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-xs tracking-tight group-hover:text-emerald-400 transition">
                                {dev.name}
                              </span>
                              {isViewing && (
                                <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal block font-sans">
                              {lang === 'km' ? dev.nameKhmer : dev.templateId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Auth Token with Reveal & Copy */}
                      <td className="py-3 px-4 font-mono" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                          <code className="text-emerald-400 select-all max-w-[150px] sm:max-w-[200px] truncate">
                            {maskedToken}
                          </code>
                          <button
                            onClick={(e) => toggleRevealToken(dev.id, e)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 transition"
                            title={isRevealed ? 'Hide' : 'Reveal'}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={(e) => copyToken(dev.authToken, dev.id, e)}
                            className="text-slate-400 hover:text-emerald-400 p-0.5 transition"
                            title="Copy Auth Token"
                          >
                            {copiedId === dev.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4 text-slate-400 text-xs font-normal font-sans">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{dev.owner}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Online</span>
                        </div>
                      </td>

                      {/* Last updated */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{dev.lastUpdated}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center gap-1">
                          <button
                            onClick={() => onSelectDevice(dev)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-semibold rounded-lg text-[11px] transition flex items-center gap-1"
                            title="Open Console Dashboard"
                          >
                            <span>Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onOpenQr(dev)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                            title="Provisioning QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRegenerateToken(dev.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Regenerate Auth Token"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      {lang === 'km' ? 'មិនមានឧបករណ៍ត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No IoT devices match your filter query.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-950/90 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">
              Total {filteredDevices.length} / {devices.length} Nodes Registered
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS Cloud Sync Active</span>
            </span>
          </div>
        </div>
      ) : (
        /* GRID VIEW OF DEVICE CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDevices.map(dev => {
            const isActive = activeDevice?.id === dev.id;
            const pinCount = Object.keys(dev.pins).length;

            return (
              <div
                key={dev.id}
                id={`device-card-${dev.id}`}
                onClick={() => handleRowClick(dev)}
                className={`rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {dev.name}
                        {isActive && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">
                            ACTIVE
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {dev.orgId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Owner:</span>
                    <span className="text-slate-300 truncate block">{dev.owner}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Wi-Fi (RSSI):</span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> {dev.rssi} dBm
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Hardware:</span>
                    <span className="text-slate-300">{dev.hardware}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Updated:</span>
                    <span className="text-emerald-400">{dev.lastUpdated}</span>
                  </div>
                </div>

                {/* Auth Token Box */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider">Auth Token:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRegenerateToken(dev.id)}
                        className="text-slate-400 hover:text-amber-400 transition flex items-center gap-1"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regen</span>
                      </button>
                      <button
                        onClick={() => onOpenQr(dev)}
                        className="text-slate-400 hover:text-cyan-400 transition ml-1"
                        title="QR Code"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-emerald-400 select-all overflow-x-auto truncate">
                      {dev.authToken}
                    </code>
                    <button
                      onClick={() => copyToken(dev.authToken, dev.id)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                    >
                      {copiedId === dev.id ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === dev.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 font-mono">
                    {pinCount} Virtual Pins Active (V0-V15)
                  </span>

                  <button
                    onClick={() => onSelectDevice(dev)}
                    className="px-3 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-semibold rounded-lg transition flex items-center gap-1"
                  >
                    <span>View Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
