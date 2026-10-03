import React, { useEffect, useState } from "react";
import { Download, Bell, BellRing, Check } from "lucide-react";

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifStatusMsg, setNotifStatusMsg] = useState("");

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install Spotsy Disc Golf PWA, tap 'Add to Home Screen' in your browser menu.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleToggleNotifications = async () => setNotifStatusMsg("Demo only: no push subscription or reminder delivery is connected.");

  return (
    <div className="bg-emerald-900/90 text-emerald-50 backdrop-blur border-b border-emerald-700/50 px-4 py-2 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center bg-emerald-700 text-white p-1 rounded-md font-bold text-xs">
            PWA
          </span>
          <span>
            Installable demo concept • local data only; no live tee-time alerts
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-2.5 py-1 rounded transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={handleToggleNotifications}
            className={`inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded transition border ${
              notificationsEnabled
                ? "bg-emerald-800 text-emerald-200 border-emerald-600"
                : "bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500"
            }`}
          >
            {notificationsEnabled ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                <span>Notifications concept</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Notifications concept</span>
              </>
            )}
          </button>
        </div>
      </div>
      {notifStatusMsg && (
        <div className="max-w-7xl mx-auto mt-1 text-[11px] text-emerald-200 flex items-center gap-1">
          <Check className="w-3 h-3" /> {notifStatusMsg}
        </div>
      )}
    </div>
  );
};
