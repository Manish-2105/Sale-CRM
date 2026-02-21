import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Target, TrendingUp, Phone, Mail, MessageSquare, Share2, 
  Award, AlertCircle, Plus, Trash2, Edit, Download, Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Target as UserTarget, KPI } from '../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'targets' | 'kpis'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, kpisRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/users'),
        fetch('/api/kpis')
      ]);
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setKpis(await kpisRes.json());
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Command Center</h1>
          <p className="text-slate-500">Academic Publishing & Journal Subscriptions Management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <TrendingUp className="w-5 h-5 text-slate-600" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {['overview', 'team', 'targets', 'kpis'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Revenue (Monthly)" 
              value={`₹${stats.teamStats?.total_revenue?.toLocaleString() || 0}`} 
              target={`Target: ₹${stats.teamTargets?.total_sales_target?.toLocaleString() || 0}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              color="emerald"
            />
            <StatCard 
              title="Total Calls" 
              value={stats.teamStats?.total_calls || 0} 
              target={`Target: ${stats.teamTargets?.total_call_target || 0}`}
              icon={<Phone className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
            <StatCard 
              title="Emails Sent" 
              value={stats.teamStats?.total_emails || 0} 
              icon={<Mail className="w-5 h-5 text-indigo-600" />}
              color="indigo"
            />
            <StatCard 
              title="Social Media" 
              value={stats.teamStats?.total_social || 0} 
              icon={<Share2 className="w-5 h-5 text-purple-600" />}
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Revenue Performance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.individualPerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="achieved_revenue" name="Achieved" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target_revenue" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Calls', value: stats.teamStats?.total_calls || 0 },
                        { name: 'Emails', value: stats.teamStats?.total_emails || 0 },
                        { name: 'WhatsApp', value: stats.teamStats?.total_whatsapp || 0 },
                        { name: 'Social', value: stats.teamStats?.total_social || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Team Performance Ranking</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>Current Month</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Rank</th>
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Revenue Achieved</th>
                    <th className="px-6 py-4 font-medium">Calls Done</th>
                    <th className="px-6 py-4 font-medium">Target Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.individualPerformance.map((perf: any, index: number) => (
                    <tr key={perf.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          index === 1 ? 'bg-slate-100 text-slate-700' : 
                          index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{perf.name}</p>
                          <p className="text-xs text-slate-500">{perf.designation}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">₹{perf.achieved_revenue?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-sm">{perf.achieved_calls || 0}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-100 rounded-full h-2 max-w-[120px]">
                          <div 
                            className="bg-slate-900 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (perf.achieved_revenue / perf.target_revenue) * 100 || 0)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <TeamManagement users={users} onUpdate={fetchData} />
      )}

      {activeTab === 'targets' && (
        <TargetManagement users={users.filter(u => u.role === 'employee')} onUpdate={fetchData} />
      )}

      {activeTab === 'kpis' && (
        <KPIManagement kpis={kpis} onUpdate={fetchData} />
      )}
    </div>
  );
}

function StatCard({ title, value, target, icon, color }: any) {
  const colorClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {target && <span className="text-xs font-medium text-slate-400">{target}</span>}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TeamManagement({ users, onUpdate }: { users: User[], onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee', designation: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setShowAdd(false);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      onUpdate();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Employee Directory</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {showAdd && (
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Name" 
              className="px-4 py-2 rounded-lg border border-slate-200"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              required
            />
            <input 
              placeholder="Email" 
              type="email"
              className="px-4 py-2 rounded-lg border border-slate-200"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <input 
              placeholder="Password" 
              type="password"
              className="px-4 py-2 rounded-lg border border-slate-200"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              required
            />
            <select 
              className="px-4 py-2 rounded-lg border border-slate-200"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as any})}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <input 
              placeholder="Designation (e.g. Sales Executive)" 
              className="px-4 py-2 rounded-lg border border-slate-200"
              value={newUser.designation}
              onChange={e => setNewUser({...newUser, designation: e.target.value})}
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-slate-200 rounded-lg py-2">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Designation</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4 text-slate-500">{user.email}</td>
                <td className="px-6 py-4 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{user.designation}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetManagement({ users, onUpdate }: { users: User[], onUpdate: () => void }) {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [target, setTarget] = useState({
    sales_target_yearly: 0,
    sales_target_monthly: 0,
    call_target_monthly: 0,
    email_target_monthly: 0,
    whatsapp_target_monthly: 0,
    social_target_monthly: 0
  });

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/targets/${selectedUser}`)
        .then(res => res.json())
        .then(data => setTarget(data.id ? data : {
          sales_target_yearly: 0,
          sales_target_monthly: 0,
          call_target_monthly: 0,
          email_target_monthly: 0,
          whatsapp_target_monthly: 0,
          social_target_monthly: 0
        }));
    }
  }, [selectedUser]);

  const handleSave = async () => {
    if (!selectedUser) return;
    await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUser,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        ...target
      })
    });
    alert('Targets updated successfully');
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold">Select Employee</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors ${
                selectedUser === user.id ? 'bg-slate-50 border-r-4 border-slate-900' : ''
              }`}
            >
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.designation}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {selectedUser ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Set Targets for {users.find(u => u.id === selectedUser)?.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Yearly Sales Target (₹)" 
                type="number" 
                value={target.sales_target_yearly} 
                onChange={v => setTarget({...target, sales_target_yearly: parseFloat(v)})} 
              />
              <InputField 
                label="Monthly Sales Target (₹)" 
                type="number" 
                value={target.sales_target_monthly} 
                onChange={v => setTarget({...target, sales_target_monthly: parseFloat(v)})} 
              />
              <InputField 
                label="Monthly Call Target" 
                type="number" 
                value={target.call_target_monthly} 
                onChange={v => setTarget({...target, call_target_monthly: parseInt(v)})} 
              />
              <InputField 
                label="Monthly Email Target" 
                type="number" 
                value={target.email_target_monthly} 
                onChange={v => setTarget({...target, email_target_monthly: parseInt(v)})} 
              />
              <InputField 
                label="Monthly WhatsApp Target" 
                type="number" 
                value={target.whatsapp_target_monthly} 
                onChange={v => setTarget({...target, whatsapp_target_monthly: parseInt(v)})} 
              />
              <InputField 
                label="Monthly Social Media Target" 
                type="number" 
                value={target.social_target_monthly} 
                onChange={v => setTarget({...target, social_target_monthly: parseInt(v)})} 
              />
            </div>
            <button 
              onClick={handleSave}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              Save Targets
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Target className="w-12 h-12 opacity-20" />
            <p>Select an employee to manage their targets</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KPIManagement({ kpis, onUpdate }: { kpis: KPI[], onUpdate: () => void }) {
  const [newKpi, setNewKpi] = useState({ name: '', description: '' });

  const handleAdd = async () => {
    await fetch('/api/kpis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKpi)
    });
    setNewKpi({ name: '', description: '' });
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold">Define New KPI</h3>
        <InputField 
          label="KPI Name" 
          value={newKpi.name} 
          onChange={v => setNewKpi({...newKpi, name: v})} 
        />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
          <textarea 
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all h-32"
            value={newKpi.description}
            onChange={e => setNewKpi({...newKpi, description: e.target.value})}
          />
        </div>
        <button 
          onClick={handleAdd}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Add KPI
        </button>
      </div>

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold">Active KPIs</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {kpis.map(kpi => (
            <div key={kpi.id} className="p-6 flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-900">{kpi.name}</p>
                <p className="text-sm text-slate-500">{kpi.description}</p>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
