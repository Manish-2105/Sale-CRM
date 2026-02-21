import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageSquare, Share2, TrendingUp, 
  Plus, Calendar, CheckCircle2, AlertCircle, Send, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Target, Report, KPI } from '../types';

export default function EmployeeDashboard({ user }: { user: User }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  
  const [newReport, setNewReport] = useState({
    calls: 0,
    emails: 0,
    whatsapp: 0,
    social: 0,
    revenue: 0,
    leads: 0,
    followups: 0,
    remarks: '',
    kpi_data: {} as any
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetRes, reportsRes, kpisRes] = await Promise.all([
        fetch(`/api/targets/${user.id}`),
        fetch(`/api/reports/${user.id}`),
        fetch('/api/kpis')
      ]);
      setTarget(await targetRes.json());
      setReports(await reportsRes.json());
      setKpis(await kpisRes.json());
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        ...newReport
      })
    });
    setShowReportForm(false);
    setNewReport({
      calls: 0,
      emails: 0,
      whatsapp: 0,
      social: 0,
      revenue: 0,
      leads: 0,
      followups: 0,
      remarks: '',
      kpi_data: {}
    });
    fetchData();
  };

  // Aggregates for current month
  const currentMonthStats = reports.reduce((acc, r) => {
    const reportDate = new Date(r.date);
    const now = new Date();
    if (reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()) {
      acc.calls += r.calls;
      acc.emails += r.emails;
      acc.whatsapp += r.whatsapp;
      acc.social += r.social;
      acc.revenue += r.revenue;
    }
    return acc;
  }, { calls: 0, emails: 0, whatsapp: 0, social: 0, revenue: 0 });

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {user.name}</h1>
          <p className="text-slate-500">{user.designation} • Academic Subscriptions Team</p>
        </div>
        <button 
          onClick={() => setShowReportForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
        >
          <Plus className="w-5 h-5" />
          Submit Daily Report
        </button>
      </div>

      {/* Target Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TargetCard 
          title="Monthly Revenue" 
          achieved={currentMonthStats.revenue} 
          target={target?.sales_target_monthly || 0} 
          unit="₹"
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <TargetCard 
          title="Calls Target" 
          achieved={currentMonthStats.calls} 
          target={target?.call_target_monthly || 0} 
          icon={<Phone className="w-5 h-5" />}
          color="blue"
        />
        <TargetCard 
          title="Email Target" 
          achieved={currentMonthStats.emails} 
          target={target?.email_target_monthly || 0} 
          icon={<Mail className="w-5 h-5" />}
          color="indigo"
        />
        <TargetCard 
          title="Social Activity" 
          achieved={currentMonthStats.social} 
          target={target?.social_target_monthly || 0} 
          icon={<Share2 className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Performance Reports</h3>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {reports.length > 0 ? reports.slice(0, 10).map((report) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-slate-900">{new Date(report.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-slate-500 italic">"{report.remarks || 'No remarks provided'}"</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">₹{report.revenue?.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Revenue Generated</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <ActivityMiniStat label="Calls" value={report.calls} />
                    <ActivityMiniStat label="Emails" value={report.emails} />
                    <ActivityMiniStat label="Leads" value={report.leads} />
                    <ActivityMiniStat label="Followups" value={report.followups} />
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No reports submitted yet. Start your daily reporting!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Motivational Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <Award className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Keep Pushing!</h3>
              <p className="text-slate-400 text-sm mb-6">You are only ₹{(target?.sales_target_monthly || 0) - currentMonthStats.revenue} away from your monthly goal.</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
                  <span>Progress</span>
                  <span>{Math.round((currentMonthStats.revenue / (target?.sales_target_monthly || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (currentMonthStats.revenue / (target?.sales_target_monthly || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Daily Checklist
            </h3>
            <ul className="space-y-3">
              <CheckItem label="Check new journal releases" checked />
              <CheckItem label="Follow up on institutional leads" />
              <CheckItem label="Update author database" />
              <CheckItem label="Submit EOD report" />
            </ul>
          </div>
        </div>
      </div>

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Daily Performance Report</h3>
              <button onClick={() => setShowReportForm(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  label="Calls Done" 
                  type="number" 
                  value={newReport.calls} 
                  onChange={(v: string) => setNewReport({...newReport, calls: parseInt(v)})} 
                />
                <InputField 
                  label="Emails Sent" 
                  type="number" 
                  value={newReport.emails} 
                  onChange={(v: string) => setNewReport({...newReport, emails: parseInt(v)})} 
                />
                <InputField 
                  label="WhatsApp Messages" 
                  type="number" 
                  value={newReport.whatsapp} 
                  onChange={(v: string) => setNewReport({...newReport, whatsapp: parseInt(v)})} 
                />
                <InputField 
                  label="Social Media Activities" 
                  type="number" 
                  value={newReport.social} 
                  onChange={(v: string) => setNewReport({...newReport, social: parseInt(v)})} 
                />
                <InputField 
                  label="Revenue Generated (₹)" 
                  type="number" 
                  value={newReport.revenue} 
                  onChange={(v: string) => setNewReport({...newReport, revenue: parseFloat(v)})} 
                />
                <InputField 
                  label="New Leads Added" 
                  type="number" 
                  value={newReport.leads} 
                  onChange={(v: string) => setNewReport({...newReport, leads: parseInt(v)})} 
                />
                <InputField 
                  label="Follow-ups Done" 
                  type="number" 
                  value={newReport.followups} 
                  onChange={(v: string) => setNewReport({...newReport, followups: parseInt(v)})} 
                />
              </div>

              {/* Dynamic KPIs */}
              {kpis.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Additional KPIs</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {kpis.map(kpi => (
                      <div key={kpi.id} className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">{kpi.name}</label>
                        <input 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                          placeholder={kpi.description}
                          onChange={e => setNewReport({
                            ...newReport, 
                            kpi_data: { ...newReport.kpi_data, [kpi.name]: e.target.value }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks / Notes</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all h-24"
                  value={newReport.remarks}
                  onChange={e => setNewReport({...newReport, remarks: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-200 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Report
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TargetCard({ title, achieved, target, unit = "", icon, color }: any) {
  const colorClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const progress = Math.min(100, (achieved / (target || 1)) * 100);

  return (
    <div className={`bg-white p-6 rounded-2xl border shadow-sm ${colorClasses[color].split(' ')[2]}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${colorClasses[color].split(' ').slice(0,2).join(' ')}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly</span>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1 mb-4">
        <p className="text-2xl font-bold text-slate-900">{unit}{achieved.toLocaleString()}</p>
        <p className="text-sm text-slate-400">/ {unit}{target.toLocaleString()}</p>
      </div>
      <div className="space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-1000 ${
              color === 'emerald' ? 'bg-emerald-500' : 
              color === 'blue' ? 'bg-blue-500' : 
              color === 'indigo' ? 'bg-indigo-500' : 'bg-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase text-right">{Math.round(progress)}% Achieved</p>
      </div>
    </div>
  );
}

function ActivityMiniStat({ label, value }: any) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function CheckItem({ label, checked = false }: any) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-600">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
      }`}>
        {checked && <CheckCircle2 className="w-3 h-3" />}
      </div>
      <span className={checked ? 'line-through opacity-50' : ''}>{label}</span>
    </li>
  );
}

function InputField({ label, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
