import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, Moon, Sun, Lock, ShieldOff, Trash2, X, Check } from 'lucide-react';
import BlockedUsersModal from './BlockedUsersModal';

export default function SettingsModal({ isOpen, onClose, onLockVault }) {
  const { settings, updateUserSettings, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showOnline, setShowOnline] = useState(settings?.show_online !== 0);
  const [showLastSeen, setShowLastSeen] = useState(settings?.show_last_seen !== 0);
  const [readReceipts, setReadReceipts] = useState(settings?.read_receipts !== 0);
  const [typingStatus, setTypingStatus] = useState(settings?.typing_status !== 0);

  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/settings', {
        show_online: showOnline ? 1 : 0,
        show_last_seen: showLastSeen ? 1 : 0,
        read_receipts: readReceipts ? 1 : 0,
        typing_status: typingStatus ? 1 : 0
      });
      updateUserSettings(res.data.settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to permanently delete your account and chat records?')) return;
    try {
      await axios.delete('/api/settings/account');
      logout();
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Application Settings</h3>
              <p className="text-xs text-slate-400">Themes, Privacy controls & Security</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Appearance Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Theme & Appearance</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                <div>
                  <h5 className="font-semibold text-white text-sm">Theme Mode</h5>
                  <p className="text-xs text-slate-400">Currently: <strong className="capitalize text-cyan-400">{theme} Mode</strong></p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Switch Theme
              </button>
            </div>
          </div>

          {/* Privacy Controls Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Privacy & Status Controls</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h5 className="font-semibold text-white text-xs">Show Online Status</h5>
                  <p className="text-[11px] text-slate-400">Allow friends to see when you are active</p>
                </div>
                <input
                  type="checkbox"
                  checked={showOnline}
                  onChange={(e) => setShowOnline(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-800/80">
                <div>
                  <h5 className="font-semibold text-white text-xs">Show Last Seen Timestamp</h5>
                  <p className="text-[11px] text-slate-400">Display last active timestamp to friends</p>
                </div>
                <input
                  type="checkbox"
                  checked={showLastSeen}
                  onChange={(e) => setShowLastSeen(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-slate-800/80">
                <div>
                  <h5 className="font-semibold text-white text-xs">Read Receipts (Blue Ticks ✓✓)</h5>
                  <p className="text-[11px] text-slate-400">Send and receive message read confirmations</p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-cyan-500"
                />
              </label>
            </div>

            <button
              onClick={handleSavePrivacy}
              disabled={saving}
              className="mt-3 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving Privacy Preferences...' : 'Save Privacy Preferences'}
            </button>
          </div>

          {/* Blocked Users Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Security & Vault Protection</h4>
            <div className="space-y-3">
              <button
                onClick={() => setShowBlockedModal(true)}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldOff className="w-5 h-5 text-rose-400" />
                  <div>
                    <h5 className="font-semibold text-white text-xs">Blocked Users List</h5>
                    <p className="text-[11px] text-slate-400">Manage unblocking blocked users</p>
                  </div>
                </div>
                <span className="text-xs text-cyan-400 font-semibold">View</span>
              </button>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h5 className="font-semibold text-white text-xs">Secret Calculator Vault</h5>
                      <p className="text-[11px] text-slate-400">App disguise & passcode protection</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      if (onLockVault) {
                        onClose();
                        onLockVault();
                      }
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-cyan-400" /> Lock App Now
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Reset secret vault 4-digit passcode? You will be prompted to set a new passcode upon lock.')) {
                        localStorage.removeItem('vault_passcode');
                        if (onLockVault) {
                          onClose();
                          onLockVault();
                        }
                      }
                    }}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs py-2 rounded-xl transition"
                  >
                    Reset Secret Code
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" /> Delete ByteChat Account
            </button>
          </div>
        </div>
      </div>

      <BlockedUsersModal isOpen={showBlockedModal} onClose={() => setShowBlockedModal(false)} />
    </div>
  );
}
