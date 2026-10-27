import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, TrendingUp, ShieldCheck, AlertTriangle, Plus, Info, RefreshCw } from 'lucide-react';
import { getDashboardSummary } from '../services/api';
import type { DashboardSummary } from '../types';
import {
  MetricCard, RiskBadge, RepaymentBadge, LoadingSpinner,
  ErrorState, DisclaimerBanner, Card, CardHeader, CardTitle, CardContent, Button,
} from '../components/ui';
import { getGreeting, truncateId } from '../lib/utils';

const SCORE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const REPAYMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboardSummary();
      setSummary(res.data);
    } catch {
      setError('Unable to load dashboard data. Ensure the backend server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <LoadingSpinner size={36} className="text-blue-600" />
        <p className="text-sm text-slate-500">Loading AltScore dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <DisclaimerBanner />
        <ErrorState message={error} retry={loadData} />
      </div>
    );
  }

  const avgScore = summary?.average_experimental_score ?? 687;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {getGreeting()}, Guest User!
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Live Evaluation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time alternative credit risk evaluation powered by financial behaviour indicators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData}>
            Refresh
          </Button>
          <Button leftIcon={<Plus size={15} />} onClick={() => navigate('/new-applicant')}>
            Evaluate New Applicant
          </Button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Applicants"
          value={summary?.total_applicants ?? 0}
          subtitle={`${summary?.total_assessments ?? 0} total assessments run`}
          icon={<Users size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Avg Experimental Score"
          value={avgScore}
          subtitle="Scale: 300 – 900"
          icon={<TrendingUp size={20} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <MetricCard
          title="Low-Risk Applicants"
          value={summary?.low_risk_count ?? 0}
          subtitle={`${summary?.low_risk_percentage ?? 0}% of scored pool`}
          icon={<ShieldCheck size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <MetricCard
          title="High-Risk Applicants"
          value={summary?.high_risk_count ?? 0}
          subtitle={`${summary?.high_risk_percentage ?? 0}% of scored pool`}
          icon={<AlertTriangle size={20} className="text-rose-600" />}
          iconBg="bg-rose-100"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Score Distribution Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Experimental Score Distribution</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Categorized across standard risk brackets (300–900)</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                4 Brackets
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {summary?.score_distribution && summary.score_distribution.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.score_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        border: '1px solid #e2e8f0',
                      }}
                      formatter={(v, _, item) => [`${v} profiles (${item.payload.label || ''})`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {summary.score_distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || SCORE_COLORS[index % SCORE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                No score distribution data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repayment Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Repayment Outcome Prediction</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Model output class probabilities</p>
          </CardHeader>
          <CardContent>
            {summary?.repayment_distribution && summary.repayment_distribution.length > 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.repayment_distribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {summary.repayment_distribution.map((entry, index) => (
                        <Cell
                          key={`repay-${index}`}
                          fill={entry.color || REPAYMENT_COLORS[index % REPAYMENT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend
                      iconSize={10}
                      wrapperStyle={{ fontSize: 11, paddingTop: '10px' }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v) => [`${v} profiles`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                No repayment distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Assessments</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Latest evaluations processed by the ML scoring engine</p>
          </div>
          <button
            onClick={() => navigate('/records')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            View all records →
          </button>
        </CardHeader>
        <div className="overflow-x-auto">
          {summary?.recent_assessments && summary.recent_assessments.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Applicant ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Risk Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Repayment Prediction
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assessment Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recent_assessments.map((a) => (
                  <tr key={a.assessment_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                      {truncateId(a.applicant_id)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-base text-slate-800">{a.score}</span>
                      <span className="text-xs text-slate-400 ml-1">/900</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge risk={a.risk_level} />
                    </td>
                    <td className="px-5 py-3.5">
                      <RepaymentBadge label={a.predicted_category} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {a.date}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/score/${a.assessment_id}`)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              No assessments recorded yet.{' '}
              <button
                onClick={() => navigate('/new-applicant')}
                className="text-blue-600 hover:underline font-medium"
              >
                Evaluate your first applicant →
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* About AltScore Card */}
      <Card>
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Info size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              About Alternative Credit Scoring
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Traditional credit bureaus rely primarily on formal loan repayments and credit card utilization,
              which creates barriers for students, freelancers, gig workers, and thin-file individuals.
              AltScore demonstrates how alternative indicators—such as utility and telecommunication bills,
              rent payment consistency, residential stability, and recurring savings patterns—can provide a holistic,
              inclusive picture of financial responsibility.
            </p>
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Note: AltScore is an experimental research prototype using synthetic datasets. Not intended for commercial credit underwriting.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
