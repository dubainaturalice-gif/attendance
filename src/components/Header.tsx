"use client";

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  user: { username: string; role: string };
}

export default function Header({ currentView, onViewChange, onLogout, user }: HeaderProps) {
  const tabs = [
    { id: "daily", label: "Daily Attendance", icon: "📋" },
    { id: "monthly", label: "Monthly Summary", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👥" },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold tracking-wide">📋 ATTENDANCE MANAGER</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-200">Welcome, {user.username}</span>
            <button
              onClick={onLogout}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="flex gap-1 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                currentView === tab.id
                  ? "bg-white text-blue-800"
                  : "text-blue-200 hover:text-white hover:bg-blue-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
