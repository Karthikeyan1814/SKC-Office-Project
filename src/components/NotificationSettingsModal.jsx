import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineBellAlert,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlinePlay,
  HiOutlineShieldCheck,
  HiOutlineDevicePhoneMobile,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import "../styles/NotificationSettingsModal.css";
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundType,
  setSoundType,
  getSoundVolume,
  setSoundVolume,
  playNotificationSound,
  SOUND_TYPES,
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  isBrowserNotificationEnabled,
  setBrowserNotificationEnabled,
  sendBrowserNotification,
} from "../utils/notificationSound";

export default function NotificationSettingsModal({ isOpen, onClose }) {
  const [soundOn, setSoundOn] = useState(true);
  const [selectedType, setSelectedType] = useState("chime");
  const [volume, setVolume] = useState(0.7);
  const [browserOn, setBrowserOn] = useState(false);
  const [permission, setPermission] = useState("default");
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Sync state with localStorage on mount & when opened
  useEffect(() => {
    if (!isOpen) return;
    setSoundOn(isSoundEnabled());
    setSelectedType(getSoundType());
    setVolume(getSoundVolume());
    setBrowserOn(isBrowserNotificationEnabled());
    setPermission(getBrowserNotificationPermission());
  }, [isOpen]);

  // Listen to external setting updates
  useEffect(() => {
    const handleSettingsChanged = () => {
      setSoundOn(isSoundEnabled());
      setSelectedType(getSoundType());
      setVolume(getSoundVolume());
      setBrowserOn(isBrowserNotificationEnabled());
      setPermission(getBrowserNotificationPermission());
    };
    window.addEventListener("skc-sound-settings-changed", handleSettingsChanged);
    return () => window.removeEventListener("skc-sound-settings-changed", handleSettingsChanged);
  }, []);

  if (!isOpen) return null;

  const handleToggleSound = (e) => {
    const nextVal = e.target.checked;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      toast.success("Notification sound enabled");
      playNotificationSound(selectedType, true);
    } else {
      toast("Notification sound muted", { icon: "🔇" });
    }
  };

  const handleSelectSoundType = (typeId) => {
    setSelectedType(typeId);
    setSoundType(typeId);
    // Play preview
    playNotificationSound(typeId, true);
  };

  const handleVolumeChange = (e) => {
    const nextVol = parseFloat(e.target.value);
    setVolume(nextVol);
    setSoundVolume(nextVol);
  };

  const handleTestSound = () => {
    setIsPlayingTest(true);
    playNotificationSound(selectedType, true);
    setTimeout(() => setIsPlayingTest(false), 600);
  };

  const handleToggleBrowserNotif = async (e) => {
    const nextVal = e.target.checked;
    if (nextVal) {
      const ok = await setBrowserNotificationEnabled(true);
      const perm = getBrowserNotificationPermission();
      setPermission(perm);
      if (ok && perm === "granted") {
        setBrowserOn(true);
        toast.success("Desktop & browser notifications activated!");
        sendBrowserNotification("Sri Kathiravan & Co. Alerts Enabled", {
          body: "You will now receive instant desktop notifications when updates arrive.",
        });
      } else if (perm === "denied") {
        setBrowserOn(false);
        toast.error("Notifications are blocked in your browser settings. Please allow notifications for this site.");
      } else {
        setBrowserOn(false);
      }
    } else {
      await setBrowserNotificationEnabled(false);
      setBrowserOn(false);
      toast("Browser push alerts disabled", { icon: "🔕" });
    }
  };

  const handleTestDesktopNotif = () => {
    if (!isBrowserNotificationSupported()) {
      toast.error("Browser notifications are not supported on this browser.");
      return;
    }
    if (getBrowserNotificationPermission() !== "granted") {
      toast.error("Please enable desktop alerts first to allow browser permissions.");
      return;
    }
    sendBrowserNotification("Sri Kathiravan & Co. - Test Alert", {
      body: "Desktop notification test successful! You're ready to receive real-time updates.",
    });
    toast.success("Test notification sent to your desktop!");
  };

  const role = localStorage.getItem("skc-role") || "USER";

  const modalContent = (
    <div className="notif-settings-overlay" onClick={onClose}>
      <div className="notif-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notif-settings-header">
          <div className="notif-settings-title-group">
            <div className="notif-settings-icon-bubble">
              <HiOutlineBellAlert size={22} />
            </div>
            <div>
              <h3>Notification &amp; Alert Settings</h3>
              <p>Configure sound chimes &amp; instant desktop alerts</p>
            </div>
          </div>
          <button
            className="notif-settings-close-btn"
            onClick={onClose}
            aria-label="Close"
            id="close-notif-settings-modal"
          >
            <HiOutlineXMark size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="notif-settings-body">
          {/* Card 1: Notification Sound */}
          <div className="notif-setting-card">
            <div className="notif-setting-row">
              <div className="notif-setting-meta">
                <div className={`notif-setting-icon-box icon-box-sound ${!soundOn ? "muted" : ""}`}>
                  {soundOn ? <HiOutlineSpeakerWave size={20} /> : <HiOutlineSpeakerXMark size={20} />}
                </div>
                <div className="notif-setting-text">
                  <span className="notif-setting-title">Audible Notification Sound</span>
                  <span className="notif-setting-desc">
                    Play a gentle melodic chime whenever new notifications, documents, or requests arrive.
                  </span>
                </div>
              </div>
              <label className="notif-toggle-switch">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={handleToggleSound}
                  id="notif-sound-toggle-input"
                />
                <span className="notif-toggle-slider" />
              </label>
            </div>

            {/* Sound options if sound is enabled */}
            {soundOn && (
              <div className="notif-options-subgrid">
                <div>
                  <div className="notif-field-label">
                    <span>Melody &amp; Chime Tone</span>
                    <span style={{ fontSize: "11px", color: "#f59e0b" }}>Synthesized Web Audio</span>
                  </div>
                  <div className="notif-sound-chips" style={{ marginTop: "8px" }}>
                    {SOUND_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`notif-sound-chip ${selectedType === t.id ? "active" : ""}`}
                        onClick={() => handleSelectSoundType(t.id)}
                      >
                        <span className="chip-name">{t.name}</span>
                        <span className="chip-desc">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="notif-field-label">
                    <span>Alert Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="notif-volume-row" style={{ marginTop: "6px" }}>
                    <HiOutlineSpeakerXMark size={16} color="rgba(255,255,255,0.4)" />
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="notif-volume-slider"
                    />
                    <HiOutlineSpeakerWave size={16} color="#f59e0b" />
                  </div>
                </div>

                <div className="notif-test-btn-group">
                  <button
                    type="button"
                    className="btn-test-sound"
                    onClick={handleTestSound}
                    id="btn-test-notification-sound"
                  >
                    <HiOutlinePlay size={16} />
                    <span>{isPlayingTest ? "Playing Chime..." : "Test Notification Sound"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Desktop / Browser Notifications */}
          <div className="notif-setting-card">
            <div className="notif-setting-row">
              <div className="notif-setting-meta">
                <div className="notif-setting-icon-box icon-box-browser">
                  <HiOutlineDevicePhoneMobile size={20} />
                </div>
                <div className="notif-setting-text">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="notif-setting-title">Desktop &amp; Browser Notifications</span>
                    {permission === "granted" ? (
                      <span className="notif-permission-badge badge-granted">
                        <HiOutlineCheck size={12} /> Permission Granted
                      </span>
                    ) : permission === "denied" ? (
                      <span className="notif-permission-badge badge-denied">Blocked in Browser</span>
                    ) : (
                      <span className="notif-permission-badge badge-default">Click to Allow</span>
                    )}
                  </div>
                  <span className="notif-setting-desc">
                    Receive native OS desktop popup alerts even when the portal is minimized or working in another tab.
                  </span>
                </div>
              </div>
              <label className="notif-toggle-switch">
                <input
                  type="checkbox"
                  checked={browserOn}
                  onChange={handleToggleBrowserNotif}
                  id="notif-browser-toggle-input"
                />
                <span className="notif-toggle-slider" />
              </label>
            </div>

            {browserOn && permission === "granted" && (
              <div className="notif-options-subgrid">
                <button
                  type="button"
                  className="btn-test-desktop"
                  onClick={handleTestDesktopNotif}
                  id="btn-test-desktop-notification"
                >
                  <HiOutlineShieldCheck size={16} />
                  <span>Send Test Desktop Alert</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="notif-settings-footer">
          <div className="notif-settings-role-tag">
            <span>Configured for: <strong>{role} Portal</strong></span>
          </div>
          <button
            className="btn-save-close"
            onClick={() => {
              onClose();
              toast.success("Notification preferences saved");
            }}
            id="btn-save-notif-settings"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
