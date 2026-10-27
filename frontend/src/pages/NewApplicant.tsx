import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  CreditCard,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { submitApplicantForScore } from '../services/api';
import type { ApplicantFormData } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  DisclaimerBanner,
} from '../components/ui';

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const applicantSchema = z.object({
  applicant_id: z.string().optional(),
  name: z.string().min(1, 'Applicant name is required'),
  age: z
    .number({ invalid_type_error: 'Age must be a valid number' })
    .int('Age must be an integer')
    .min(18, 'Applicant must be at least 18 years old')
    .max(100, 'Age must be 100 or younger'),
  employment_status: z.string().min(1, 'Please select employment status'),
  educational_background: z.string().min(1, 'Please select educational background'),
  bank_account_tenure: z.string().min(1, 'Please select bank account tenure'),
  residential_stability: z.string().min(1, 'Please select residential stability'),
  utility_payment_history: z.string().min(1, 'Please select utility payment history'),
  rent_payment_history: z.string().min(1, 'Please select rent payment history'),
  telecommunications_payment_history: z.string().min(1, 'Please select telecommunications payment history'),
  savings_pattern: z.string().min(1, 'Please select savings pattern'),
  gig_economy_participation: z.string().optional(),
});

type FormValues = z.infer<typeof applicantSchema>;

// ─── Preset Sample Profiles for Quick Demo ────────────────────────────────────
const PRESET_PROFILES: { label: string; description: string; data: FormValues }[] = [
  {
    label: 'College Student (Thin-File)',
    description: 'No bank history, on-time utilities, no formal credit',
    data: {
      applicant_id: '',
      name: 'Aarav Patel',
      age: 21,
      employment_status: 'Student',
      educational_background: 'Graduate',
      bank_account_tenure: 'Less than 1 year',
      residential_stability: '1–3 years',
      rent_payment_history: 'Mostly on time',
      utility_payment_history: 'Always on time',
      telecommunications_payment_history: 'Always on time',
      savings_pattern: 'Some savings',
      gig_economy_participation: 'Part-Time',
    },
  },
  {
    label: 'Gig-Economy Driver',
    description: 'Platform worker, regular savings, solid utility history',
    data: {
      applicant_id: '',
      name: 'Priya Sharma',
      age: 29,
      employment_status: 'Self-employed',
      educational_background: 'Diploma',
      bank_account_tenure: '2–5 years',
      residential_stability: 'More than 3 years',
      rent_payment_history: 'Always on time',
      utility_payment_history: 'Always on time',
      telecommunications_payment_history: 'Always on time',
      savings_pattern: 'Regular savings',
      gig_economy_participation: 'Full-Time',
    },
  },
  {
    label: 'Freelance Designer',
    description: 'Variable income, good residential stability, mostly on-time rent',
    data: {
      applicant_id: '',
      name: 'Rohan Mehta',
      age: 34,
      employment_status: 'Freelancer',
      educational_background: 'Postgraduate',
      bank_account_tenure: 'More than 5 years',
      residential_stability: '1–3 years',
      rent_payment_history: 'Mostly on time',
      utility_payment_history: 'Mostly on time',
      telecommunications_payment_history: 'Always on time',
      savings_pattern: 'Some savings',
      gig_economy_participation: 'None',
    },
  },
  {
    label: 'Credit-Stressed Freelancer',
    description: 'Late utility & rent payments, little or no savings',
    data: {
      applicant_id: '',
      name: 'Vikram Singh',
      age: 26,
      employment_status: 'Freelancer',
      educational_background: 'High School',
      bank_account_tenure: '1–2 years',
      residential_stability: 'Less than 1 year',
      rent_payment_history: 'Frequently late',
      utility_payment_history: 'Frequently late',
      telecommunications_payment_history: 'Mostly on time',
      savings_pattern: 'Little or no savings',
      gig_economy_participation: 'Part-Time',
    },
  },
];

export default function NewApplicant() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(applicantSchema),
    defaultValues: {
      applicant_id: '',
      name: '',
      age: 28,
      employment_status: 'Salaried',
      educational_background: 'Graduate',
      bank_account_tenure: '2–5 years',
      residential_stability: '1–3 years',
      utility_payment_history: 'Always on time',
      rent_payment_history: 'Always on time',
      telecommunications_payment_history: 'Always on time',
      savings_pattern: 'Regular savings',
      gig_economy_participation: 'None',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const payload: ApplicantFormData = {
        ...values,
        applicant_id: values.applicant_id?.trim() || undefined,
        persist: true,
      };

      const res = await submitApplicantForScore(payload);
      const assessmentId = res.data.assessment_id;
      navigate(`/score/${assessmentId}`, { state: { scoreData: res.data } });
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to calculate score. Please check that backend is running.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_PROFILES[0]) => {
    reset(preset.data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">New Applicant Evaluation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Capture demographic and non-traditional behavioral data to generate an AI-powered experimental credit score.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Preset Profiles Bar */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Quick-Fill Test Profiles
            </h3>
            <span className="text-[11px] text-slate-500">
              (Click to auto-populate form for instant demonstration)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_PROFILES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left p-2.5 rounded-lg border border-white/80 bg-white hover:border-blue-300 hover:shadow-xs transition group"
              >
                <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                  {p.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Submission Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section A: Personal & Educational Information */}
        <Card>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <User size={15} />
              </div>
              <div>
                <CardTitle>Section A: Personal & Educational Information</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Basic applicant demographics and occupation</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Applicant Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maya Chen"
                  {...register('name')}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Custom Applicant ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Applicant ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Auto-generated if blank</span>
                </div>
                <input
                  type="text"
                  placeholder="Leave blank for auto-generation (e.g. A1001)"
                  {...register('applicant_id')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  {...register('age', { valueAsNumber: true })}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.age ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.age && (
                  <p className="text-xs text-rose-500 mt-1">{errors.age.message}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">Must be between 18 and 100</p>
              </div>

              {/* Employment Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Employment Status <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('employment_status')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Salaried">Salaried (Full-time / Permanent)</option>
                  <option value="Self-employed">Self-employed / Business Owner</option>
                  <option value="Freelancer">Freelancer / Independent Contractor</option>
                  <option value="Student">Student (Undergraduate / Postgraduate)</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Other">Other</option>
                </select>
                {errors.employment_status && (
                  <p className="text-xs text-rose-500 mt-1">{errors.employment_status.message}</p>
                )}
              </div>

              {/* Educational Background */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Highest Educational Background <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('educational_background')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Graduate">Graduate (Bachelor's Degree)</option>
                  <option value="Postgraduate">Postgraduate (Master's / Ph.D.)</option>
                  <option value="Diploma">Diploma / Vocational Certificate</option>
                  <option value="High School">High School (12th Grade)</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.educational_background && (
                  <p className="text-xs text-rose-500 mt-1">{errors.educational_background.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Alternative Financial Indicators */}
        <Card>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CreditCard size={15} />
              </div>
              <div>
                <CardTitle>Section B: Alternative Financial & Stability Indicators</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Non-traditional payment reliability, banking history, and residential tenure
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Bank Account Tenure */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bank Account Tenure <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('bank_account_tenure')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="More than 5 years">More than 5 years</option>
                  <option value="2–5 years">2–5 years</option>
                  <option value="1–2 years">1–2 years</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="No bank account">No bank account</option>
                </select>
                {errors.bank_account_tenure && (
                  <p className="text-xs text-rose-500 mt-1">{errors.bank_account_tenure.message}</p>
                )}
              </div>

              {/* Residential Stability */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Residential Stability <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('residential_stability')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="More than 3 years">More than 3 years</option>
                  <option value="1–3 years">1–3 years</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                </select>
                {errors.residential_stability && (
                  <p className="text-xs text-rose-500 mt-1">{errors.residential_stability.message}</p>
                )}
              </div>

              {/* Utility Payment History */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Utility Payment History (Electricity, Water, Gas) <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('utility_payment_history')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Always on time">Always on time (100% on schedule)</option>
                  <option value="Mostly on time">Mostly on time (rarely 1-5 days late)</option>
                  <option value="Frequently late">Frequently late (frequent delays)</option>
                  <option value="No payment history">No payment history / Included in rent</option>
                </select>
                {errors.utility_payment_history && (
                  <p className="text-xs text-rose-500 mt-1">{errors.utility_payment_history.message}</p>
                )}
              </div>

              {/* Rent Payment History */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rent Payment History <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('rent_payment_history')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Always on time">Always on time</option>
                  <option value="Mostly on time">Mostly on time</option>
                  <option value="Frequently late">Frequently late</option>
                  <option value="No payment history">No payment history / Own residence</option>
                </select>
                {errors.rent_payment_history && (
                  <p className="text-xs text-rose-500 mt-1">{errors.rent_payment_history.message}</p>
                )}
              </div>

              {/* Telecommunications Payment History */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Telecommunications Payment (Phone / Broadband) <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('telecommunications_payment_history')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Always on time">Always on time</option>
                  <option value="Mostly on time">Mostly on time</option>
                  <option value="Frequently late">Frequently late</option>
                  <option value="No payment history">No payment history</option>
                </select>
                {errors.telecommunications_payment_history && (
                  <p className="text-xs text-rose-500 mt-1">{errors.telecommunications_payment_history.message}</p>
                )}
              </div>

              {/* Savings Pattern */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monthly Savings Pattern <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('savings_pattern')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Regular savings">Regular savings (Monthly deposits)</option>
                  <option value="Some savings">Some savings (Occasional surplus)</option>
                  <option value="Little or no savings">Little or no savings</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.savings_pattern && (
                  <p className="text-xs text-rose-500 mt-1">{errors.savings_pattern.message}</p>
                )}
              </div>

              {/* Gig Economy Participation */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gig Economy Participation (Delivery, Rideshare, Freelance Platforms)
                </label>
                <select
                  {...register('gig_economy_participation')}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="None">None (Traditional or not participating)</option>
                  <option value="Part-Time">Part-Time Platform Worker</option>
                  <option value="Full-Time">Full-Time Platform Worker</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button & Confirmation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <span>Scores are computed instantly via trained Machine Learning pipeline</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              disabled={submitting}
            >
              Reset Form
            </Button>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              leftIcon={<Sparkles size={16} />}
            >
              Generate Experimental Score
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
