import { IoTDevice, VirtualPinId, DeviceLog, TelemetryPoint, AutomationRule, TimeFilter } from '../types';

class IoTService {
  private eventSource: EventSource | null = null;
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  // Play subtle realistic tactile click sound on relay toggle
  public playRelaySound(state: boolean) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = state ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(state ? 580 : 380, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(state ? 880 : 200, this.audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.06);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  public setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Subscribe to real-time Server-Sent Events
  public subscribeToStream(callbacks: {
    onDeviceUpdate?: (data: { deviceId: string; device: IoTDevice }) => void;
    onTelemetryTick?: (data: { point: TelemetryPoint; deviceId: string; pins: Record<VirtualPinId, any> }) => void;
    onLogAdded?: (log: DeviceLog) => void;
    onLogsCleared?: () => void;
    onAutomationTriggered?: (data: { ruleId: string; lastTriggered: string }) => void;
    onSimulationStatus?: (data: { isSimulating: boolean }) => void;
    onConnected?: () => void;
  }) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/iot/events');

      this.eventSource.addEventListener('connected', () => {
        if (callbacks.onConnected) callbacks.onConnected();
      });

      this.eventSource.addEventListener('device_update', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (callbacks.onDeviceUpdate) callbacks.onDeviceUpdate(data);
        } catch (err) {
          console.error('Error parsing device_update SSE', err);
        }
      });

      this.eventSource.addEventListener('telemetry_tick', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (callbacks.onTelemetryTick) callbacks.onTelemetryTick(data);
        } catch (err) {
          console.error('Error parsing telemetry_tick SSE', err);
        }
      });

      this.eventSource.addEventListener('log_added', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (callbacks.onLogAdded) callbacks.onLogAdded(data);
        } catch (err) {
          console.error('Error parsing log_added SSE', err);
        }
      });

      this.eventSource.addEventListener('logs_cleared', () => {
        if (callbacks.onLogsCleared) callbacks.onLogsCleared();
      });

      this.eventSource.addEventListener('automation_triggered', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (callbacks.onAutomationTriggered) callbacks.onAutomationTriggered(data);
        } catch (err) {
          console.error('Error parsing automation_triggered SSE', err);
        }
      });

      this.eventSource.addEventListener('simulation_status', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (callbacks.onSimulationStatus) callbacks.onSimulationStatus(data);
        } catch (err) {
          console.error('Error parsing simulation_status SSE', err);
        }
      });

      this.eventSource.onerror = () => {
        // SSE auto reconnects, no crash
      };
    } catch (e) {
      console.warn('SSE connection initialization failed', e);
    }

    return () => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
    };
  }

  // Fetch list of devices
  public async getDevices(): Promise<IoTDevice[]> {
    try {
      const res = await fetch('/api/iot/devices');
      const json = await res.json();
      return json.devices || [];
    } catch {
      return [];
    }
  }

  // Update a pin value via REST API & Local IP if present
  public async updatePin(token: string, pin: VirtualPinId, value: number | string, customIp?: string, deviceId?: string): Promise<boolean> {
    try {
      // 1. If user entered a local IP (e.g. 192.168.0.169), dispatch direct LAN call immediately
      const savedIp = customIp || (typeof window !== 'undefined' ? (localStorage.getItem(`sps_peh_chip_ip_${deviceId || ''}`) || '192.168.0.169') : null);
      if (savedIp) {
        try {
          const actionPath = Number(value) === 1 ? 'on' : 'off';
          const isTrueState = Number(value) === 1;
          
          // Redundant & cross-compatible control URLs targeting physical ESP32
          const urlsToFetch: string[] = [];
          
          if (deviceId === 'dev_smart_irrigation') {
            if (pin === 'V0') {
              urlsToFetch.push(`http://${savedIp}/controlPump?state=${value}`);
              urlsToFetch.push(`http://${savedIp}/controlPump?state=${isTrueState ? '1' : '0'}`);
            } else if (pin === 'V3') {
              urlsToFetch.push(`http://${savedIp}/toggleAuto?state=${value}`);
              urlsToFetch.push(`http://${savedIp}/toggleAuto?state=${isTrueState ? '1' : '0'}`);
            }
          } else if (deviceId === 'dev_alert_system') {
            if (pin === 'V6') {
              urlsToFetch.push(`http://${savedIp}/controlBuzzer?state=${value}`);
              urlsToFetch.push(`http://${savedIp}/controlBuzzer?state=${isTrueState ? '1' : '0'}`);
            } else if (pin === 'V3') {
              urlsToFetch.push(`http://${savedIp}/controlStrobe?state=${value}`);
            } else if (pin === 'V4') {
              urlsToFetch.push(`http://${savedIp}/controlFan?speed=${value}`);
            }
          } else if (deviceId === 'dev_school_lights') {
            if (pin === 'V1') urlsToFetch.push(`http://${savedIp}/led1/${actionPath}`);
            if (pin === 'V2') urlsToFetch.push(`http://${savedIp}/led2/${actionPath}`);
            if (pin === 'V3') urlsToFetch.push(`http://${savedIp}/led3/${actionPath}`);
          } else if (deviceId === 'dev_smart_bin') {
            if (pin === 'V0') {
              urlsToFetch.push(`http://${savedIp}/toggle?target=lid&state=${isTrueState ? '1' : '0'}`);
              urlsToFetch.push(`http://${savedIp}/toggleLid?state=${isTrueState ? '1' : '0'}`);
              urlsToFetch.push(`http://${savedIp}/${isTrueState ? 'open' : 'close'}`);
              urlsToFetch.push(`http://${savedIp}/control?pin=v0&val=${value}`);
            } else if (pin === 'V2') {
              urlsToFetch.push(`http://${savedIp}/toggle?target=telegram&state=${isTrueState ? '1' : '0'}`);
              urlsToFetch.push(`http://${savedIp}/toggleTelegram?state=${isTrueState ? '1' : '0'}`);
            } else if (pin === 'V5') {
              urlsToFetch.push(`http://${savedIp}/toggle?target=call&state=${isTrueState ? '1' : '0'}`);
              urlsToFetch.push(`http://${savedIp}/toggleCall?state=${isTrueState ? '1' : '0'}`);
            } else if (pin === 'V6') {
              urlsToFetch.push(`http://${savedIp}/toggle?target=sort&state=${value}`);
              urlsToFetch.push(`http://${savedIp}/sortWaste?type=${value === 180 ? 'wet' : value === 0 ? 'dry' : 'ready'}`);
            }
          }
          
          // Add general standards
          urlsToFetch.push(`http://${savedIp}/control?pin=${pin.toLowerCase()}&val=${value}`);
          urlsToFetch.push(`http://${savedIp}/${actionPath}?pin=${pin.toLowerCase()}&val=${value}&t=${Date.now()}`);
          urlsToFetch.push(`http://${savedIp}/set?pin=${pin.toLowerCase()}&val=${value}`);
          urlsToFetch.push(`http://${savedIp}/api/update?${pin.toLowerCase()}=${value}`);
          
          try {
            const ifr = (document.getElementById('esp_hidden_sender') as HTMLIFrameElement) || document.createElement('iframe');
            ifr.id = 'esp_hidden_sender';
            ifr.style.display = 'none';
            if (!document.body.contains(ifr)) {
              document.body.appendChild(ifr);
            }
            ifr.src = urlsToFetch[0];
          } catch (e) {
            console.warn('Iframe blocked on mobile Safari', e);
          }
          
          // Trigger fetch call asynchronously
          urlsToFetch.forEach(url => {
            fetch(url, { mode: 'no-cors' }).catch(() => {});
          });
          
        } catch (e) {
          console.warn('Direct LAN update outer block failed', e);
        }
      }

      const res = await fetch(`/api/iot/update?token=${encodeURIComponent(token)}&pin=${encodeURIComponent(pin)}&value=${encodeURIComponent(value)}&ip=${encodeURIComponent(savedIp || '')}`);
      const json = await res.json();
      return json.success;
    } catch (e) {
      console.error('Failed to update pin', e);
      return false;
    }
  }

  // Direct fetch/poll from ESP32 IP
  public async pollDeviceDirectIp(ip: string): Promise<{ success: boolean; data?: any; latencyMs?: number; error?: string }> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`http://${ip}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        return { success: true, data, latencyMs };
      }
      return { success: false, error: `HTTP ${res.status}`, latencyMs };
    } catch (err: any) {
      // Try backend proxy if direct browser fetch hit CORS or network block
      try {
        const proxyRes = await fetch(`/api/iot/chip/poll-ip?ip=${encodeURIComponent(ip)}`);
        const json = await proxyRes.json();
        const latencyMs = Date.now() - startTime;
        return { success: json.success, data: json.data, latencyMs, error: json.error };
      } catch (proxyErr: any) {
        return { success: false, error: err?.message || 'Connection failed', latencyMs: Date.now() - startTime };
      }
    }
  }

  // Fetch telemetry history
  public async getHistory(range: TimeFilter): Promise<TelemetryPoint[]> {
    try {
      const res = await fetch(`/api/iot/history?range=${encodeURIComponent(range)}`);
      const json = await res.json();
      return json.points || [];
    } catch {
      return [];
    }
  }

  // Fetch logs
  public async getLogs(): Promise<DeviceLog[]> {
    try {
      const res = await fetch('/api/iot/logs');
      const json = await res.json();
      return json.logs || [];
    } catch {
      return [];
    }
  }

  // Clear logs
  public async clearLogs(): Promise<boolean> {
    try {
      const res = await fetch('/api/iot/logs/clear', { method: 'POST' });
      const json = await res.json();
      return json.success;
    } catch {
      return false;
    }
  }

  // Get automations
  public async getAutomations(): Promise<AutomationRule[]> {
    try {
      const res = await fetch('/api/iot/automations');
      const json = await res.json();
      return json.automations || [];
    } catch {
      return [];
    }
  }

  // Save automations
  public async saveAutomations(rules: AutomationRule[]): Promise<boolean> {
    try {
      const res = await fetch('/api/iot/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automations: rules })
      });
      const json = await res.json();
      return json.success;
    } catch {
      return false;
    }
  }

  // Toggle simulator
  public async toggleSimulator(enabled?: boolean): Promise<boolean> {
    try {
      const res = await fetch('/api/iot/simulate/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const json = await res.json();
      return json.isSimulating;
    } catch {
      return false;
    }
  }

  // Regenerate Auth Token
  public async regenerateToken(deviceId: string): Promise<string | null> {
    try {
      const res = await fetch('/api/iot/device/regenerate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      const json = await res.json();
      return json.authToken || null;
    } catch {
      return null;
    }
  }

  // Create new device
  public async createDevice(data: { name: string; nameKhmer: string; templateId: string; orgId: string }): Promise<IoTDevice | null> {
    try {
      const res = await fetch('/api/iot/device/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      return json.device || null;
    } catch {
      return null;
    }
  }
}

export const iotService = new IoTService();

export async function pollDeviceDirectIp(ip: string): Promise<{ online: boolean; mode?: string; status?: any }> {
  try {
    const res = await iotService.pollDeviceDirectIp(ip);
    return {
      online: res.success,
      mode: res.data?.mode || 'Dual-Mode AP+STA',
      status: res.data
    };
  } catch {
    return { online: false };
  }
}
