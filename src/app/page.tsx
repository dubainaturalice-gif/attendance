"use client";

import { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import Header from "@/components/Header";
import DailyAttendance from "@/components/DailyAttendance";
import MonthlySummary from "@/components/MonthlySummary";
import EmployeeManagement from "@/components/EmployeeManagement";

interface User {
  username: string;
  role: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState("daily");
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.error) {
          setSetupNeeded(true);
        }
      } catch {
        setSetupNeeded(true);
      }
      setCheckingSetup(false);
    };
    checkSetup();

    const savedUser = localStorage.getItem("attendance_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("attendance_user");
      }
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("attendance_user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("attendance_user");
  };

  const handleSetupComplete = () => {
    setSetupNeeded(false);
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onSetup={handleSetupComplete} setupNeeded={setupNeeded} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} user={user} />
      <main>
        {currentView === "daily" && <DailyAttendance />}
        {currentView === "monthly" && <MonthlySummary />}
        {currentView === "employees" && <EmployeeManagement />}
      </main>
    </div>
  );
}
