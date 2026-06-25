"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { reviewApplicationService } from "@/app/services/review.service";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NomineeForm {
  name: string;
  relationship: string;
  nid: string;
  dob: string;
  share: string;
  contact: string;
}

interface BoForm {
  accountType: string;
  dp: string;
  bank: string;
  settlementAccount: string;
  tin: string;
  cash: boolean;
  margin: boolean;
  foreign: boolean;
}

// ─── Submission Success Modal ─────────────────────────────────────────────────

function SubmissionModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-5">

        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your eKYC registration has been received successfully.
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Awaiting Bank Approval
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs text-gray-500 leading-relaxed">
            Our team will review your submitted documents and identity verification records.
            You will be notified once your BO account is activated.
          </p>
          <p className="text-xs text-gray-400">
            Typical processing time: <span className="font-semibold text-gray-600">1–3 business days</span>
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Go to My Profile →
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ReadField({ value }: { value?: string | null }) {
  return (
    <div className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-md text-sm text-gray-800">
      {value || "—"}
    </div>
  );
}

function SectionHeader({
  label,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: {
  label: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
      <h2 className="text-xs font-bold tracking-wider text-cyan-700 uppercase">{label}</h2>
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 border border-blue-200 bg-blue-50/50 px-3 py-1.5 rounded-md transition-colors"
        >
          ✏️ Edit Fields
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-md bg-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md shadow-xs transition-colors disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "✓ Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md">
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Review() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Basic Info ──────────────────────────────────────────────────────────────
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);
const [editBasic, setEditBasic] = useState({
  applicationId: "",
  fullNameBangla: "",
  dateOfBirth: "",          
  fatherNameBangla: "",
  motherNameBangla: "",
  spouseName: "",           
  nidNumber: "",            
  bloodGroup: "",           
  birthPlace: "",           
  email: "",
  phoneNumber: "",          
  presentAddress: "",
  postCode: "",             
  occupation: "",
  employer: "",
  monthlyIncome: "",
});

  // ── Nominees ────────────────────────────────────────────────────────────────
  const [isEditingNominees, setIsEditingNominees] = useState(false);
  const [isSavingNominees, setIsSavingNominees] = useState(false);
  const [nomineeError, setNomineeError] = useState<string | null>(null);
  const [editNominees, setEditNominees] = useState<NomineeForm[]>([]);

  // ── BO Account ──────────────────────────────────────────────────────────────
  const [isEditingBo, setIsEditingBo] = useState(false);
  const [isSavingBo, setIsSavingBo] = useState(false);
  const [boError, setBoError] = useState<string | null>(null);
  const [editBo, setEditBo] = useState<BoForm>({
    accountType: "",
    dp: "",
    bank: "",
    settlementAccount: "",
    tin: "",
    cash: false,
    margin: false,
    foreign: false,
  });

  const [loadError, setLoadError] = useState<string | null>(null);
  const anyEditing = isEditingBasic || isEditingNominees || isEditingBo;

  // ─── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await reviewApplicationService.getSummary();
      setUserData(data);

setEditBasic({
  applicationId: data.personal.applicationId || "",
  fullNameBangla: data.personal.fullNameBangla || "",
  dateOfBirth: data.personal.dateOfBirth || "",
  fatherNameBangla: data.personal.fatherNameBangla || "",
  motherNameBangla: data.personal.motherNameBangla || "",
  spouseName: data.personal.spouseName || "",
  nidNumber: data.personal.nidNumber || "",
  bloodGroup: data.personal.bloodGroup || "",
  birthPlace: data.personal.birthPlace || "",
  email: data.personal.email || "",
  phoneNumber: data.personal.phoneNumber || "",
  presentAddress: data.personal.presentAddress || "",
  postCode: data.personal.postCode || "",
  occupation: data.personal.occupation || "",
  employer: data.personal.employer || "",
  monthlyIncome: data.personal.monthlyIncome || "",
});

      setEditNominees(
        (data.nominees || []).map((n: any) => ({
          name: n.name || "",
          relationship: n.relationship || "",
          nid: n.nid || "",
          dob: n.dob || "",
          share: n.share || "",
          contact: n.contact || "",
        }))
      );

      setEditBo({
        accountType: data.boPrefs.accountType || "",
        dp: data.boPrefs.dp || "",
        bank: data.boPrefs.bank || "",
        settlementAccount: data.boPrefs.settlementAccount || "",
        tin: data.boPrefs.tin || "",
        cash: data.permissions?.cash ?? false,
        margin: data.permissions?.margin ?? false,
        foreign: data.permissions?.foreign ?? false,
      });
    } catch (error: any) {
      setLoadError(error.message || "Failed to load review data.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Handlers ────────────────────────────────────────────────────────

  const handleSaveBasic = async () => {
    try {
      setIsSavingBasic(true);
      setBasicError(null);
      await reviewApplicationService.updateBasicProfile({
        fullNameBangla: editBasic.fullNameBangla,
        fatherNameBangla: editBasic.fatherNameBangla,
        motherNameBangla: editBasic.motherNameBangla,
        email: editBasic.email,
        occupation: editBasic.occupation,
        employer: editBasic.employer,
        monthlyIncome: editBasic.monthlyIncome,
        presentAddress: editBasic.presentAddress,
      });
      setIsEditingBasic(false);
      await fetchReviewData();
    } catch (err: any) {
      setBasicError(err.response?.data?.message || err.message || "Failed to save basic info.");
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSaveNominees = async () => {
    try {
      setIsSavingNominees(true);
      setNomineeError(null);
      await reviewApplicationService.updateNominees({ nominees: editNominees });
      setIsEditingNominees(false);
      await fetchReviewData();
    } catch (err: any) {
      setNomineeError(err.response?.data?.message || err.message || "Failed to save nominees.");
    } finally {
      setIsSavingNominees(false);
    }
  };

  const handleSaveBo = async () => {
    try {
      setIsSavingBo(true);
      setBoError(null);
      await reviewApplicationService.updateBoAccounts(editBo);
      setIsEditingBo(false);
      await fetchReviewData();
    } catch (err: any) {
      setBoError(err.response?.data?.message || err.message || "Failed to save BO account.");
    } finally {
      setIsSavingBo(false);
    }
  };

  // ─── Submit Handler ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await reviewApplicationService.submitApplication();
      setShowModal(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Nominee helper ───────────────────────────────────────────────────────

  const updateNominee = (index: number, field: keyof NomineeForm, value: string) => {
    setEditNominees((prev) =>
      prev.map((n, i) => (i === index ? { ...n, [field]: value } : n))
    );
  };

  // ─── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Assembling pipeline records...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-red-100 rounded-xl text-center shadow-xs">
        <p className="text-red-600 font-semibold mb-2">Review Summary Pipeline Error</p>
        <p className="text-sm text-gray-500 mb-6">{loadError}</p>
        <button
          onClick={fetchReviewData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full min-h-[calc(100vh-160px)] bg-slate-50 py-12 px-4 md:px-8">

      {/* Submission Modal */}
      {showModal && (
        <SubmissionModal onContinue={() => router.push("/profile")} />
      )}

      <div className="max-w-6xl mx-auto space-y-6 pb-24">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Review Your Application</h1>
        </div>

        {/* ═══ 1. BASIC IDENTITY ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <SectionHeader
            label="1. Basic Identity Records"
            isEditing={isEditingBasic}
            isSaving={isSavingBasic}
            onEdit={() => setIsEditingBasic(true)}
            onCancel={() => { setIsEditingBasic(false); setBasicError(null); }}
            onSave={handleSaveBasic}
          />
          <InlineError message={basicError} />

<div className="space-y-4">

  {/* Name English — locked */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
    <span className="text-sm font-medium text-gray-500">Name (English)</span>
    <div className="w-full sm:col-span-2 px-3 py-2 bg-slate-100/70 border border-gray-200 rounded-md text-sm text-gray-500 select-none">
      {userData?.personal.fullNameEnglish}
      <span className="text-[10px] ml-1 text-gray-400">(Verified from NID)</span>
    </div>
  </div>

  {/* Name Bangla + Date of Birth */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Name & Birth</span>
    <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Name (Bangla)</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.fullNameBangla}
            onChange={(e) => setEditBasic({ ...editBasic, fullNameBangla: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.fullNameBangla} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Date of Birth</span>
        {isEditingBasic ? (
          <input type="date" value={editBasic.dateOfBirth}
            onChange={(e) => setEditBasic({ ...editBasic, dateOfBirth: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.dateOfBirth} />}
      </div>
    </div>
  </div>

  {/* Father / Mother */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Family Info (Bangla)</span>
    <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Father's Name</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.fatherNameBangla}
            onChange={(e) => setEditBasic({ ...editBasic, fatherNameBangla: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.fatherNameBangla} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Mother's Name</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.motherNameBangla}
            onChange={(e) => setEditBasic({ ...editBasic, motherNameBangla: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.motherNameBangla} />}
      </div>
    </div>
  </div>

  {/* Spouse */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
    <span className="text-sm font-medium text-gray-500">Spouse Name</span>
    <div className="w-full sm:col-span-2">
      {isEditingBasic ? (
        <input type="text" value={editBasic.spouseName}
          onChange={(e) => setEditBasic({ ...editBasic, spouseName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      ) : <ReadField value={userData?.personal.spouseName} />}
    </div>
  </div>

  <hr className="border-dashed border-gray-100" />

  {/* NID + Blood Group + Birth Place */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Identity & Medical</span>
    <div className="w-full sm:col-span-2 grid grid-cols-3 gap-2">
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">NID Number</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.nidNumber}
            onChange={(e) => setEditBasic({ ...editBasic, nidNumber: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : (
          <div className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
            {userData?.personal.nidNumber || "—"}
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Blood Group</span>
        {isEditingBasic ? (
          <select value={editBasic.bloodGroup}
            onChange={(e) => setEditBasic({ ...editBasic, bloodGroup: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        ) : <ReadField value={userData?.personal.bloodGroup} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Birth Place</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.birthPlace}
            onChange={(e) => setEditBasic({ ...editBasic, birthPlace: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.birthPlace} />}
      </div>
    </div>
  </div>

  {/* Email + Phone */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Contact Details</span>
    <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Email Address</span>
        {isEditingBasic ? (
          <input type="email" value={editBasic.email}
            onChange={(e) => setEditBasic({ ...editBasic, email: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.email} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Phone Number</span>
        {isEditingBasic ? (
          <input type="tel" value={editBasic.phoneNumber}
            onChange={(e) => setEditBasic({ ...editBasic, phoneNumber: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.phoneNumber} />}
      </div>
    </div>
  </div>

  {/* Address + Post Code */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Mailing Address</span>
    <div className="w-full sm:col-span-2 grid grid-cols-3 gap-2">
      <div className="col-span-2">
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Present Address</span>
        {isEditingBasic ? (
          <textarea rows={2} value={editBasic.presentAddress}
            onChange={(e) => setEditBasic({ ...editBasic, presentAddress: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.presentAddress} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Post Code</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.postCode}
            onChange={(e) => setEditBasic({ ...editBasic, postCode: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : <ReadField value={userData?.personal.postCode} />}
      </div>
    </div>
  </div>

  <hr className="border-dashed border-gray-100" />

  {/* Occupation + Employer */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
    <span className="text-sm font-medium text-gray-500 pt-2">Professional Setup</span>
    <div className="w-full sm:col-span-2 grid grid-cols-2 gap-2">
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Occupation</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.occupation}
            onChange={(e) => setEditBasic({ ...editBasic, occupation: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
        ) : <ReadField value={userData?.personal.occupation} />}
      </div>
      <div>
        <span className="text-[10px] text-gray-400 block font-bold uppercase mb-1">Employer</span>
        {isEditingBasic ? (
          <input type="text" value={editBasic.employer}
            onChange={(e) => setEditBasic({ ...editBasic, employer: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
        ) : <ReadField value={userData?.personal.employer} />}
      </div>
    </div>
  </div>

  {/* Monthly Income */}
  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
    <span className="text-sm font-medium text-gray-500">Monthly Income</span>
    <div className="w-full sm:col-span-2">
      {isEditingBasic ? (
        <select value={editBasic.monthlyIncome}
          onChange={(e) => setEditBasic({ ...editBasic, monthlyIncome: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="Below BDT 50,000">Below BDT 50,000</option>
          <option value="BDT 50,000 - BDT 1,000,000">BDT 50,000 – BDT 1,000,000</option>
          <option value="Above BDT 1,000,000">Above BDT 1,000,000</option>
        </select>
      ) : <ReadField value={userData?.personal.monthlyIncome} />}
    </div>
  </div>

</div>
        </div>

        {/* ═══ 2. NOMINEES ═════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <SectionHeader
            label={`2. Nominee Information (${editNominees.length})`}
            isEditing={isEditingNominees}
            isSaving={isSavingNominees}
            onEdit={() => setIsEditingNominees(true)}
            onCancel={() => { setIsEditingNominees(false); setNomineeError(null); }}
            onSave={handleSaveNominees}
          />
          <InlineError message={nomineeError} />

          <div className="space-y-6">
            {editNominees.map((nominee, index) => (
              <div key={index}
                className={`rounded-lg border p-4 space-y-4 ${
                  isEditingNominees ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-cyan-700 uppercase">
                    Nominee #{index + 1}
                  </span>
                  {!isEditingNominees && (
                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full">
                      {nominee.share} allocation
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Full Name</span>
                    {isEditingNominees ? (
                      <input type="text" value={nominee.name}
                        onChange={(e) => updateNominee(index, "name", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm font-semibold text-slate-800">{nominee.name || "—"}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Relationship</span>
                    {isEditingNominees ? (
                      <input type="text" value={nominee.relationship}
                        onChange={(e) => updateNominee(index, "relationship", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm text-slate-700">{nominee.relationship || "—"}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">NID / Passport</span>
                    {isEditingNominees ? (
                      <input type="text" value={nominee.nid}
                        onChange={(e) => updateNominee(index, "nid", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm font-mono text-slate-700">{nominee.nid || "—"}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Date of Birth</span>
                    {isEditingNominees ? (
                      <input type="date" value={nominee.dob}
                        onChange={(e) => updateNominee(index, "dob", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm text-slate-700">{nominee.dob || "—"}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Share % Allocation</span>
                    {isEditingNominees ? (
                      <input type="text" value={nominee.share} placeholder="e.g. 100% or 50%"
                        onChange={(e) => updateNominee(index, "share", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm font-bold text-cyan-700">{nominee.share || "—"}</p>}
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Contact Number</span>
                    {isEditingNominees ? (
                      <input type="tel" value={nominee.contact}
                        onChange={(e) => updateNominee(index, "contact", e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : <p className="text-sm text-slate-700">{nominee.contact || "—"}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 3. BO ACCOUNT ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 md:p-8 space-y-6">
          <SectionHeader
            label="3. Trading Account Settlement"
            isEditing={isEditingBo}
            isSaving={isSavingBo}
            onEdit={() => setIsEditingBo(true)}
            onCancel={() => { setIsEditingBo(false); setBoError(null); }}
            onSave={handleSaveBo}
          />
          <InlineError message={boError} />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Account Setup Type</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <select value={editBo.accountType}
                    onChange={(e) => setEditBo({ ...editBo, accountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Joint">Joint</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                ) : <ReadField value={userData?.boPrefs.accountType} />}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Depository Participant</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <input type="text" value={editBo.dp}
                    onChange={(e) => setEditBo({ ...editBo, dp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                ) : <ReadField value={userData?.boPrefs.dp} />}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Settlement Clearing Bank</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <input type="text" value={editBo.bank}
                    onChange={(e) => setEditBo({ ...editBo, bank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                ) : <ReadField value={userData?.boPrefs.bank} />}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Bank Account Number</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <input type="text" value={editBo.settlementAccount}
                    onChange={(e) => setEditBo({ ...editBo, settlementAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                    {userData?.boPrefs.settlementAccount || "—"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <span className="text-sm font-medium text-gray-500">TIN Number</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <input type="text" value={editBo.tin}
                    onChange={(e) => setEditBo({ ...editBo, tin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-md text-sm font-mono text-gray-800">
                    {userData?.boPrefs.tin || "—"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
              <span className="text-sm font-medium text-gray-500 pt-1">Market Segments</span>
              <div className="w-full sm:col-span-2">
                {isEditingBo ? (
                  <div className="flex flex-wrap gap-4">
                    {(["cash", "margin", "foreign"] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={editBo[key]}
                          onChange={(e) => setEditBo({ ...editBo, [key]: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">{key} Market</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Cash Market", active: userData?.permissions?.cash },
                      { label: "Margin Market", active: userData?.permissions?.margin },
                      { label: "Foreign Market", active: userData?.permissions?.foreign },
                    ].map(({ label, active }) => (
                      <span key={label}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          active
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-100 border-gray-200 text-gray-400"
                        }`}
                      >
                        {active ? "✓" : "✗"} {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 4. DECLARATION ══════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <label className="flex items-start cursor-pointer select-none group">
            <input
              type="checkbox"
              disabled={anyEditing}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 border-gray-300 rounded text-blue-600 accent-blue-600 disabled:opacity-40"
            />
            <span className="ml-3 text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
              I hereby declare that all information provided in this electronic profile registry is accurate,
              updated, and matches my verified government identifiers completely.
            </span>
          </label>

          {anyEditing && (
            <p className="mt-3 ml-8 text-xs text-amber-600">
              ⚠ Please save or cancel any open edits before submitting.
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">
            {submitError}
          </div>
        )}

        {/* ═══ ACTION BUTTONS ══════════════════════════════════════════════ */}
        <div className="w-full flex justify-end gap-4 border-t border-slate-200/60 pt-6">
          {/* <button
            onClick={() => router.back()}
            disabled={anyEditing || isSubmitting}
            className="bg-gray-500 text-white px-8 py-3 rounded cursor-pointer transition-colors hover:bg-gray-600 disabled:opacity-50"
          >
            Back
          </button> */}

          <button
            disabled={!agreed || anyEditing || isSubmitting}
            onClick={handleSubmit}
            className={`px-10 py-3 rounded text-white font-semibold transition-all flex items-center gap-2 ${
              agreed && !anyEditing && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>

      </div>
    </div>
  );
}