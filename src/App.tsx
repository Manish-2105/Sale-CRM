import React, { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { LogOut, BookOpen, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('crm_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  if (loading) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ScholarCRM</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900 leading-none">{user.name}</p>
                  <p className="text-slate-500 leading-none mt-1">{user.designation}</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-12">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard user={user} />
        )}
      </main>

      <footer className="py-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
          © 2026 Scholar Academic Publishing Group • Internal CRM System
        </p>
      </footer>
    </div>
  );
}
