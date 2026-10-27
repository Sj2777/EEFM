import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Eye,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getApplicants,
  exportDataCSV,
  reassessApplicant,
  triggerDownload,
} from '../services/api';
import type { PaginatedApplicants, ApplicantItem } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  RiskBadge,
  RepaymentBadge,
  LoadingSpinner,
  DisclaimerBanner,
  EmptyState,
} from '../components/ui';
import { truncateId } from '../lib/utils';

export default function ApplicantRecords() {
  const navigate = useNavigate();

  // State
  const [data, setData] = useState<PaginatedApplicants | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reassessingId, setReassessingId] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const res = await getApplicants({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        employment_status: employmentFilter || undefined,
        risk_level: riskFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setData(res.data);
    } catch {
      // Graceful fallback
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [page, employmentFilter, riskFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadApplicants();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await exportDataCSV('csv');
      triggerDownload(new Blob([res.data], { type: 'text/csv' }), 'AltScore_Applicant_Records.csv');
    } catch {
      alert('Failed to export records. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleReassess = async (applicantId: string) => {
    setReassessingId(applicantId);
    try {
      const res = await reassessApplicant(applicantId);
      navigate(`/score/${res.data.assessment_id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Reassessment failed.');
    } finally {
      setReassessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Applicant Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and inspect applicant credit assessments and risk profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            loading={exporting}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            leftIcon={<UserPlus size={14} />}
            onClick={() => navigate('/new-applicant')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            New Applicant
          </Button>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by Applicant ID or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </form>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Employment */}
              <select
                value={employmentFilter}
                onChange={(e) => {
                  setEmploymentFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Employment Types</option>
                <option value="Salaried">Salaried</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Student">Student</option>
                <option value="Unemployed">Unemployed</option>
              </select>

              {/* Risk Category */}
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Risk Tiers</option>
                <option value="Good">Good (700–900)</option>
                <option value="Fair">Fair (600–699)</option>
                <option value="Poor">Poor (500–599)</option>
                <option value="High Risk">High Risk (300–499)</option>
              </select>

              {/* Sort By */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-');
                  setSortBy(sb);
                  setSortOrder(so as 'asc' | 'desc');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Score: High to Low</option>
                <option value="score-asc">Score: Low to High</option>
                <option value="id-asc">Applicant ID (A–Z)</option>
              </select>

              {/* Reset Filters */}
              {(search || employmentFilter || riskFilter || sortBy !== 'date') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setEmploymentFilter('');
                    setRiskFilter('');
                    setSortBy('date');
                    setSortOrder('desc');
                    setPage(1);
                  }}
                  className="text-xs text-blue-600 hover:underline px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <LoadingSpinner size={32} className="text-blue-600" />
              <p className="text-xs text-slate-400">Loading applicant directory...</p>
            </div>
          ) : data && data.items.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Applicant ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name / Demographics
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employment
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Experimental Score
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Risk Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Repayment Prediction
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item) => (
                  <tr key={item.applicant_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID */}
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">
                      {item.applicant_id}
                    </td>

                    {/* Name & Age */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{item.name || `Applicant ${item.applicant_id}`}</div>
                      <div className="text-[11px] text-slate-400">Age: {item.age} years</div>
                    </td>

                    {/* Employment */}
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.employment_status}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-base text-slate-800">{item.score}</span>
                      <span className="text-xs text-slate-400 ml-1">/900</span>
                    </td>

                    {/* Risk Level */}
                    <td className="px-5 py-3.5">
                      <RiskBadge risk={item.risk_level} />
                    </td>

                    {/* Repayment */}
                    <td className="px-5 py-3.5">
                      <RepaymentBadge label={item.predicted_category} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.date}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/score/${item.assessment_id}`)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition"
                          title="View Score & Explanation"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          disabled={reassessingId === item.applicant_id}
                          onClick={() => handleReassess(item.applicant_id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition disabled:opacity-50"
                          title="Re-run ML Scoring"
                        >
                          <RotateCcw
                            size={12}
                            className={reassessingId === item.applicant_id ? 'animate-spin' : ''}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No Applicant Records Found"
              description="No applicants matched your current search filters. Try clearing your filters or evaluate a new applicant."
              action={
                <Button size="sm" onClick={() => navigate('/new-applicant')}>
                  Evaluate New Applicant
                </Button>
              }
            />
          )}
        </div>

        {/* Pagination Footer */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(page * pageSize, data.total)}
              </span>{' '}
              of <span className="font-semibold">{data.total}</span> applicants
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              <span className="px-2 text-xs font-medium text-slate-700">
                Page {page} of {data.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
