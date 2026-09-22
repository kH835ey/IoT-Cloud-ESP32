import React, { useState } from 'react';
import { AutomationRule, VirtualPinId } from '../types';
import {
  Zap,
  Plus,
  Play,
  Check,
  Power,
  Sliders,
  Bell,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AutomationsViewProps {
  automations: AutomationRule[];
  onSaveAutomations: (rules: AutomationRule[]) => void;
  lang: 'km' | 'en';
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  automations,
  onSaveAutomations,
  lang,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleNameKhmer, setRuleNameKhmer] = useState('');
  const [sourcePin, setSourcePin] = useState<VirtualPinId>('V0');
  const [condition, setCondition] = useState<'gt' | 'gte' | 'lt' | 'lte' | 'eq'>('gte');
  const [threshold, setThreshold] = useState(30.0);
  const [targetPin, setTargetPin] = useState<VirtualPinId>('V4');
  const [targetValue, setTargetValue] = useState(90);

  const toggleRule = (id: string) => {
    const updated = automations.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    onSaveAutomations(updated);
  };

  const deleteRule = (id: string) => {
    const updated = automations.filter(r => r.id !== id);
    onSaveAutomations(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: AutomationRule = {
      id: `auto_${Date.now()}`,
      name: ruleName || `Auto Control ${targetPin}`,
      nameKhmer: ruleNameKhmer || `បញ្ជាស្វ័យប្រវត្ត ${targetPin}`,
      enabled: true,
      sourcePin,
      condition,
      threshold: Number(threshold),
      targetPin,
      targetValue: Number(targetValue),
      cooldownSeconds: 30,
      lastTriggered: 'Just added',
      actionDescription: `If ${sourcePin} ${condition} ${threshold} -> Set ${targetPin} = ${targetValue}`,
    };

    onSaveAutomations([...automations, newRule]);
    setShowAddModal(false);
    setRuleName('');
    setRuleNameKhmer('');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.3 } });
  };

  return (
    <div id="automations-view" className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold font-mono border border-amber-500/30">
              {automations.length} {lang === 'km' ? 'ក្បួនសកម្ម' : 'Active Rules'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {lang === 'km' ? 'ក្បួនបញ្ជាស្វ័យប្រវត្ត (Event Automations Engine)' : 'Blynk Event Automations'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'km'
              ? 'បង្កើតលក្ខខណ្ឌបញ្ជាស្វ័យប្រវត្ត (ឧទាហរណ៍៖ ប្រសិនសីតុណ្ហភាព > 30°C ត្រូវបើកកង្ហារ V4 ភ្លាមៗ)'
              : 'Trigger edge actions when sensor values cross defined thresholds.'}
          </p>
        </div>

        <button
          id="add-automation-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'km' ? '+ បង្កើតក្បួនថ្មី (New Rule)' : '+ Add Automation Rule'}</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map(rule => (
          <div
            key={rule.id}
            id={`automation-card-${rule.id}`}
            className={`rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
              rule.enabled
                ? 'bg-slate-900/90 border-slate-700 shadow-xl'
                : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}
          >
            <div>
              {/* Header: Status switch */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                  RULE ID: {rule.id.substring(0, 8)}
                </span>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    rule.enabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  {rule.enabled ? 'ENABLED' : 'PAUSED'}
                </button>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">
                {lang === 'km' ? rule.nameKhmer || rule.name : rule.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-4 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                {rule.actionDescription}
              </p>

              {/* Visual Flow diagram */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs mb-3">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">SOURCE PIN</span>
                  <strong className="text-orange-400 font-mono font-bold">{rule.sourcePin}</strong>
                </div>
                <div className="text-center px-2">
                  <span className="text-[10px] text-slate-500 block">CONDITION</span>
                  <span className="text-amber-300 font-mono font-bold">
                    {rule.condition === 'gte' ? '>=' : (rule.condition === 'lte' ? '<=' : rule.condition)} {rule.threshold}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">ACTION PIN</span>
                  <strong className="text-emerald-400 font-mono font-bold">{rule.targetPin} &rarr; {rule.targetValue}</strong>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                Last Trigger: {rule.lastTriggered || 'Never'}
              </span>

              <button
                onClick={() => deleteRule(rule.id)}
                className="text-slate-500 hover:text-red-400 transition p-1"
                title="Delete Rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              {lang === 'km' ? 'បង្កើតក្បួនស្វ័យប្រវត្តថ្មី' : 'Create New Automation Rule'}
            </h3>

            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Rule Title (English):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auto Cooling Fan"
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Rule Title (Khmer):</label>
                <input
                  type="text"
                  placeholder="ឧទាហរណ៍៖ បើកកង្ហារស្វ័យប្រវត្ត"
                  value={ruleNameKhmer}
                  onChange={e => setRuleNameKhmer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Source Sensor:</label>
                  <select
                    value={sourcePin}
                    onChange={e => setSourcePin(e.target.value as VirtualPinId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="V0">V0 (Temp °C)</option>
                    <option value="V1">V1 (Humidity %)</option>
                    <option value="V5">V5 (Gas PPM)</option>
                    <option value="V7">V7 (Soil Moisture)</option>
                    <option value="V8">V8 (Voltage)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Condition:</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="gte">&gt;= (Greater or Equal)</option>
                    <option value="gt">&gt; (Greater than)</option>
                    <option value="lte">&lt;= (Less or Equal)</option>
                    <option value="lt">&lt; (Less than)</option>
                    <option value="eq">== (Exact match)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Threshold Value:</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Target Actuator PIN:</label>
                  <select
                    value={targetPin}
                    onChange={e => setTargetPin(e.target.value as VirtualPinId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="V2">V2 (Water Pump Relay)</option>
                    <option value="V3">V3 (Grow Light Relay)</option>
                    <option value="V4">V4 (Fan Speed PWM)</option>
                    <option value="V6">V6 (Siren Buzzer LED)</option>
                    <option value="V9">V9 (Aux Actuator 3)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Target Value to Set:</label>
                  <input
                    type="number"
                    required
                    value={targetValue}
                    onChange={e => setTargetValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Automation Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
