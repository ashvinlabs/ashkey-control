import { useState, useEffect } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";

// Define the DeviceInfo interface
interface DeviceInfo {
  id: string;
  name: string;
  vendor_id: number;
  product_id: number;
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);

  useEffect(() => {
    if (activeTab === "devices") {
      // Initial fetch
      invoke<DeviceInfo[]>("enumerate_devices")
        .then(setDevices)
        .catch(console.error);

      // Poll every 2 seconds
      const interval = setInterval(() => {
        invoke<DeviceInfo[]>("enumerate_devices")
          .then(setDevices)
          .catch(console.error);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-950 p-4 flex flex-col border-r border-neutral-800">
        <div className="mb-8 flex items-center justify-center">
          <h1 className="text-xl font-bold tracking-wider text-cyan-400">ASHKEY</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            label="Mappings"
            active={activeTab === "mappings"}
            onClick={() => setActiveTab("mappings")}
          />
          <SidebarItem
            label="Devices"
            active={activeTab === "devices"}
            onClick={() => setActiveTab("devices")}
          />
        </nav>

        <div className="text-xs text-neutral-500 text-center mt-auto">
          v0.1.0 Connected
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto bg-neutral-900">
        <header className="mb-8 border-b border-neutral-800 pb-4">
          <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
          <p className="text-neutral-400 text-sm">Manage your device settings</p>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Active Profile" status="Default" />
            <Card title="Input Status" status="Active" />
            <Card title="System" status="Ready" />
          </div>
        )}

        {activeTab === "mappings" && (
          <div className="text-neutral-400">Visual mapping interface coming soon...</div>
        )}

        {activeTab === "devices" && (
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-neutral-500">Scanning for devices...</div>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="bg-neutral-800 p-4 rounded-lg flex items-center justify-between border border-neutral-700">
                  <div>
                    <div className="font-medium text-white">{device.name}</div>
                    <div className="text-xs text-neutral-500 font-mono">VID: {device.vendor_id.toString(16).toUpperCase().padStart(4, '0')} | PID: {device.product_id.toString(16).toUpperCase().padStart(4, '0')}</div>
                  </div>
                  <div className="text-xs text-cyan-400 bg-cyan-900/20 px-2 py-1 rounded">Raw Input</div>
                </div>
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// Simple internal components for now
function SidebarItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-md transition-colors duration-200 ${active
        ? "bg-cyan-900/20 text-cyan-400 border border-cyan-900/50"
        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
        }`}
    >
      {label}
    </button>
  );
}

function Card({ title, status }: { title: string; status: string }) {
  return (
    <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 hover:border-cyan-900/50 transition-colors">
      <h3 className="text-neutral-400 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-white">{status}</div>
    </div>
  );
}

export default App;
