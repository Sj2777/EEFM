import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  BarChart3,
  Download,
  Database,
  TrendingUp,
  Award,
  Hash,
  Briefcase,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  getAnalyticsSummary,
  downloadAnalyticsReport,
  triggerDownload,
} from '../services/api';
import type { AnalyticsSummary } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  LoadingSpinner,
  DisclaimerBanner,
  MetricCard,
  ErrorState,
} from '../components/ui';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PATTERN_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'];

export default function AnalyticsReports() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'employment'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAnalyticsSummary();
        setSummary(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const res = await downloadAnalyticsReport();
      triggerDownload(
        new Blob([res.data], { type: 'application/pdf' }),
        'AltScore_Analytics_Report.pdf'
      );
    } catch {
      alert('Failed to generate PDF report. Check server status.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <LoadingSpinner size={36} className="text-blue-600" />
        <p className="text-sm text-slate-500">Aggregating portfolio analytics...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        <DisclaimerBanner />
        <ErrorState message={error || 'Unable to load analytics summary'} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Analytics & Portfolio Reports</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {summary.data_source}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Macro-level statistical distributions, repayment patterns, and alternative data trends.
          </p>
        </div>

        <Button
          leftIcon={<Download size={14} />}
          loading={downloading}
          onClick={handleDownloadReport}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Download PDF Summary
        </Button>
      </div>

      <DisclaimerBanner />

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Analyzed Profiles"
          value={summary.total_applicants}
          subtitle="Portfolio sample size"
          icon={<Database size={18} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Average Score"
          value={summary.average_score}
          subtitle={`Median: ${summary.median_score}`}
          icon={<TrendingUp size={18} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <MetricCard
          title="Min Score"
          value={summary.min_score}
          subtitle="Lower bound (High Risk)"
          icon={<Hash size={18} className="text-rose-600" />}
          iconBg="bg-rose-100"
        />
        <MetricCard
          title="Max Score"
          value={summary.max_score}
          subtitle="Upper bound (Low Risk)"
          icon={<Award size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-semibold transition border-b-2 -mb-px ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Score Tiers & Payment Trends
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`pb-3 font-semibold transition border-b-2 -mb-px ${
            activeTab === 'patterns'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Patterns Breakdown
        </button>
        <button
          onClick={() => setActiveTab('employment')}
          className={`pb-3 font-semibold transition border-b-2 -mb-px ${
            activeTab === 'employment'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Risk by Employment Category
        </button>
      </div>

      {/* Tab 1: Overview (Donut Chart + Line Chart) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Score Tier Distribution</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Proportion of applicants across credit tiers
              </p>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.score_donut}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {summary.score_donut.map((entry, index) => (
                        <Cell
                          key={`donut-${index}`}
                          fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v, _, item) => [
                        `${v} applicants (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tier Breakdown Table */}
              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                {summary.score_donut.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Line Chart: Payment Trends */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>6-Month On-Time Payment Trends</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monthly compliance rate across Rent, Utility, and Telecom
                  </p>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                  +12% 6mo improvement
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.payment_trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v) => [`${v}% on-time`, 'Compliance']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="telecom"
                      name="Telecom Payments"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="utilities"
                      name="Utility Bills"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rent"
                      name="Rent Payments"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 mt-3 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed">
                Telecommunications and Utility bills demonstrate the highest stability and consistency across all borrower demographics, serving as the strongest early-stage predictors for repayment reliability.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Payment Patterns (Rent, Utilities, Telecom Breakdown) */}
      {activeTab === 'patterns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rent Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Rent Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.payment_patterns.rent} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => [`${v} applicants`, 'Count']} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Utility Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Utility Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.payment_patterns.utilities} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => [`${v} applicants`, 'Count']} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Telecom Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Telecom Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.payment_patterns.telecom} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v) => [`${v} applicants`, 'Count']} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Risk by Employment */}
      {activeTab === 'employment' && (
        <Card>
          <CardHeader>
            <CardTitle>Risk & Average Score by Employment Type</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating credit score variations between salaried, freelance, gig workers, and students
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Employment Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Sample Count</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Est. Avg Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.risk_by_employment.map((r) => {
                    const tier =
                      r.avg_estimated_score >= 700
                        ? 'Good'
                        : r.avg_estimated_score >= 600
                        ? 'Fair'
                        : 'Poor';
                    return (
                      <tr key={r.employment} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5 font-medium text-slate-800">{r.employment}</td>
                        <td className="px-5 py-3.5 text-slate-600">{r.count} applicants</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{r.avg_estimated_score}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              tier === 'Good'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tier === 'Fair'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
