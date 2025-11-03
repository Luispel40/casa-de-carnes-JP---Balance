import Sidebar from "./_components/Sidebar";
import SettingsContent from "./_components/SettingsContent";
import { SettingsProvider } from "./_components/SettingsProvider";

export default function SettingsPage() {
  return (
    <SettingsProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <SettingsContent />
        </div>
      </div>
    </SettingsProvider>
  );
}
