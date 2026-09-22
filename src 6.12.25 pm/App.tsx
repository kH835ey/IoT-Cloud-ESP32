import React, { useState, useEffect, useCallback } from 'react';
import {
  IoTDevice,
  VirtualPinId,
  TelemetryPoint,
  AutomationRule,
  DeviceLog,
  TimeFilter,
  NavigationTab
} from './types';
import { INITIAL_DEVICES, INITIAL_AUTOMATIONS, generateInitialTelemetryHistory, INITIAL_LOGS } from './data/initialData';
import { iotService } from './services/iotService';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { DashboardBuilderView } from './components/DashboardBuilderView';
import { DevicesView } from './components/DevicesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AutomationsView } from './components/AutomationsView';
import { DeviceLogsView } from './components/DeviceLogsView';
import { FirmwareView } from './components/FirmwareView';
import { SimulatorModal } from './components/SimulatorModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { NewDeviceModal } from './components/NewDeviceModal';
import { QrCodeModal } from './components/QrCodeModal';

export default function App() {
  const [devices, setDevices] = useState<IoTDevice[]>(INITIAL_DEVICES);
  const [activeDevice, setActiveDevice] = useState<IoTDevice | null>(INITIAL_DEVICES[0]);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => generateInitialTelemetryHistory(35));
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [logs, setLogs] = useState<DeviceLog[]>(INITIAL_LOGS);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('live');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [lang, setLang] = useState<'km' | 'en'>('km');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('blynk_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('blynk_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  // Modals state
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [isApiDocsModalOpen, setIsApiDocsModalOpen] = useState(false);
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState(false);
  const [qrModalDevice, setQrModalDevice] = useState<IoTDevice | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial fetch from backend REST APIs
  useEffect(() => {
    async function loadData() {
      const [devs, hist, lg, auto] = await Promise.all([
        iotService.getDevices(),
        iotService.getHistory(timeFilter),
        iotService.getLogs(),
        iotService.getAutomations(),
      ]);

      if (devs && devs.length > 0) {
        setDevices(devs);
        setActiveDevice(prev => {
          if (!prev) return devs[0];
          const match = devs.find(d => d.id === prev.id);
          return match || devs[0];
        });
      }
      if (hist && hist.length > 0) setTelemetryHistory(hist);
      if (lg && lg.length > 0) setLogs(lg);
      if (auto && auto.length > 0) setAutomations(auto);
    }
    loadData();
  }, [timeFilter]);

  // Subscribe to real-time Server-Sent Events (SSE)
  useEffect(() => {
    const unsubscribe = iotService.subscribeToStream({
      onDeviceUpdate: ({ deviceId, device }) => {
        setDevices(prev => prev.map(d => (d.id === deviceId ? device : d)));
        setActiveDevice(prev => (prev?.id === deviceId ? device : prev));
      },
      onTelemetryTick: ({ point, deviceId, pins }) => {
        setTelemetryHistory(prev => {
          const next = [...prev, point];
          return next.slice(-200);
        });

        setDevices(prev =>
          prev.map(d => {
            if (d.id === deviceId) {
              const mergedPins = { ...d.pins };
              if (pins) {
                Object.keys(pins).forEach(pk => {
                  const pKey = pk as VirtualPinId;
                  if (mergedPins[pKey]) {
                    // Never let greenhouse/primary device pins overwrite unrelated devices or relays
                    const isActuator = mergedPins[pKey].type === 'relay' || mergedPins[pKey].type === 'status_led';
                    if (!isActuator) {
                      mergedPins[pKey] = { ...mergedPins[pKey], ...pins[pKey] };
                    }
                  }
                });
              }
              return { ...d, lastSeen: 'Just now', pins: mergedPins };
            }
            return d;
          })
        );

        setActiveDevice(prev => {
          if (prev && prev.id === deviceId) {
            const mergedPins = { ...prev.pins };
            if (pins) {
              Object.keys(pins).forEach(pk => {
                const pKey = pk as VirtualPinId;
                if (mergedPins[pKey]) {
                  const isActuator = mergedPins[pKey].type === 'relay' || mergedPins[pKey].type === 'status_led';
                  if (!isActuator) {
                    mergedPins[pKey] = { ...mergedPins[pKey], ...pins[pKey] };
                  }
                }
              });
            }
            return { ...prev, lastSeen: 'Just now', pins: mergedPins };
          }
          return prev;
        });
      },
      onLogAdded: (log) => {
        setLogs(prev => [log, ...prev.slice(0, 199)]);
      },
      onLogsCleared: () => {
        setLogs([]);
      },
      onAutomationTriggered: ({ ruleId, lastTriggered }) => {
        setAutomations(prev =>
          prev.map(r => (r.id === ruleId ? { ...r, lastTriggered } : r))
        );
      },
      onSimulationStatus: ({ isSimulating: sim }) => {
        setIsSimulating(sim);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update Pin Handler with optimistic state + audio feedback
  const handleUpdatePin = useCallback(async (pin: VirtualPinId, value: number | string) => {
    if (!activeDevice) return;

    const isRelay = activeDevice.pins[pin]?.type === 'relay' || activeDevice.pins[pin]?.type === 'status_led';
    if (isRelay) {
      iotService.playRelaySound(Number(value) === 1);
    }

    // Optimistic UI update
    setActiveDevice(prev => {
      if (!prev) return null;
      const updatedPins = {
        ...prev.pins,
        [pin]: {
          ...prev.pins[pin],
          value,
        },
      };
      return { ...prev, pins: updatedPins };
    });

    setDevices(prev =>
      prev.map(d => {
        if (d.id === activeDevice.id) {
          return {
            ...d,
            pins: {
              ...d.pins,
              [pin]: {
                ...d.pins[pin],
                value,
              },
            },
          };
        }
        return d;
      })
    );

    // Call REST backend with the correct isolated IP address (checks localStorage first, then falls back to backend's device.ipAddress)
    const savedIp = typeof window !== 'undefined' && activeDevice.id
      ? localStorage.getItem(`sps_peh_chip_ip_${activeDevice.id}`) || activeDevice.ipAddress || '192.168.0.169'
      : activeDevice.ipAddress || '192.168.0.169';

    await iotService.updatePin(activeDevice.authToken, pin, value, savedIp, activeDevice.id);
  }, [activeDevice]);

  // Toggle simulation
  const handleToggleSimulation = async () => {
    const nextState = await iotService.toggleSimulator(!isSimulating);
    setIsSimulating(nextState);
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    iotService.setSoundEnabled(next);
  };

  // Regenerate Token
  const handleRegenerateToken = async (deviceId: string) => {
    const newToken = await iotService.regenerateToken(deviceId);
    if (newToken) {
      setDevices(prev =>
        prev.map(d => (d.id === deviceId ? { ...d, authToken: newToken } : d))
      );
      if (activeDevice?.id === deviceId) {
        setActiveDevice(prev => (prev ? { ...prev, authToken: newToken } : null));
      }
    }
  };

  // Create new device
  const handleCreateDevice = async (data: { name: string; nameKhmer: string; templateId: string; orgId: string }) => {
    const newDev = await iotService.createDevice(data);
    if (newDev) {
      setDevices(prev => [...prev, newDev]);
      setActiveDevice(newDev);
    }
  };

  // Save automations
  const handleSaveAutomations = async (rules: AutomationRule[]) => {
    setAutomations(rules);
    await iotService.saveAutomations(rules);
  };

  // Clear logs
  const handleClearLogs = async () => {
    setLogs([]);
    await iotService.clearLogs();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'simulator') {
            setIsSimulatorModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
          setIsSidebarOpen(false); // Close sidebar on ALL screens after selecting
        }}
        lang={lang}
        activeDeviceCount={devices.length}
        automationsCount={automations.filter(r => r.enabled).length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar */}
        <TopNav
          onToggleSidebar={() => setIsSidebarOpen(v => !v)}
          devices={devices}
          activeDevice={activeDevice}
          onSelectDevice={setActiveDevice}
          isSimulating={isSimulating}
          onToggleSimulation={handleToggleSimulation}
          lang={lang}
          onToggleLang={() => setLang(l => (l === 'km' ? 'en' : 'km'))}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenQr={() => setQrModalDevice(activeDevice)}
          onOpenApiDocs={() => setIsApiDocsModalOpen(true)}
          onOpenSimulator={() => setIsSimulatorModalOpen(true)}
        />

        {/* View Routing */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              device={activeDevice}
              telemetryData={telemetryHistory}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              onUpdatePin={handleUpdatePin}
              lang={lang}
            />
          )}

          {currentTab === 'widget_builder' && (
            <DashboardBuilderView
              device={activeDevice}
              onUpdatePin={handleUpdatePin}
              lang={lang}
            />
          )}

          {currentTab === 'devices' && (
            <DevicesView
              devices={devices}
              activeDevice={activeDevice}
              onSelectDevice={setActiveDevice}
              onRegenerateToken={handleRegenerateToken}
              onOpenNewDeviceModal={() => setIsNewDeviceModalOpen(true)}
              onOpenQr={setQrModalDevice}
              onNavigateToDashboard={(dev) => {
                setActiveDevice(dev);
                setCurrentTab('dashboard');
              }}
              lang={lang}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              telemetryData={telemetryHistory}
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
              lang={lang}
            />
          )}

          {currentTab === 'automations' && (
            <AutomationsView
              automations={automations}
              onSaveAutomations={handleSaveAutomations}
              lang={lang}
            />
          )}

          {currentTab === 'logs' && (
            <DeviceLogsView
              logs={logs}
              onClearLogs={handleClearLogs}
              lang={lang}
            />
          )}

          {currentTab === 'firmware' && (
            <FirmwareView
              device={activeDevice}
              lang={lang}
            />
          )}
        </main>
      </div>

      {/* Interactive Simulator Modal */}
      <SimulatorModal
        device={activeDevice}
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        isSimulating={isSimulating}
        onToggleSimulating={handleToggleSimulation}
        onUpdatePin={handleUpdatePin}
        lang={lang}
      />

      {/* REST API Tester & Documentation Modal */}
      <ApiDocsModal
        device={activeDevice}
        isOpen={isApiDocsModalOpen}
        onClose={() => setIsApiDocsModalOpen(false)}
        lang={lang}
      />

      {/* New Device Registration Modal */}
      <NewDeviceModal
        isOpen={isNewDeviceModalOpen}
        onClose={() => setIsNewDeviceModalOpen(false)}
        onCreateDevice={handleCreateDevice}
        lang={lang}
      />

      {/* QR Code Provisioning Modal */}
      <QrCodeModal
        device={qrModalDevice}
        isOpen={qrModalDevice !== null}
        onClose={() => setQrModalDevice(null)}
        lang={lang}
      />
    </div>
  );
}
