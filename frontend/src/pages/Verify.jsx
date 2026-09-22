import { useState } from "react";
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import { Button, Card, Container, SectionHeading } from "../components/ui";
import VerificationResult from "../components/verification/VerificationResult.jsx";
import { createVerification } from "../services/verificationService.js";

const demoClaim = "A message says that all schools in Juba have been ordered to close tomorrow.";

function getVerificationErrorMessage(error) {
  if (error.status === 503) {
    if (error.code === "EVIDENCE_RETRIEVAL_FAILED" || error.code === "SEARCH_PROVIDER_ERROR" || error.code === "SEARCH_TIMEOUT") {
      return "Verification is temporarily unavailable. Please try again later.";
    }
    return "Verification is temporarily unavailable. Please try again later.";
  }

  if (error.status === 400) {
    return "Please check the claim and try again.";
  }

  if (error.status === 401) {
    return "Your session has expired. Please sign in again to continue.";
  }

  if (error.status === 403) {
    return "You are not authorized to submit this verification request.";
  }

  if (error.status === 429) {
    return "Verification is temporarily rate-limited. Please wait and try again later.";
  }

  if (error.status >= 500) {
    return "Verification is temporarily unavailable. Please try again later.";
  }

  return error.message || "We could not verify this claim. Please try again.";
}

export default function Verify() {
  const [claim, setClaim] = useState("");
  const [verification, setVerification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isTechnicalFailure, setIsTechnicalFailure] = useState(false);

  const handleCheck = async (event) => {
    event.preventDefault();

    if (claim.trim().length < 10) {
      setError("Please enter at least 10 characters to verify.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setVerification(null);
    setIsTechnicalFailure(false);

    try {
      const response = await createVerification({
        claim: claim.trim(),
      });
      setVerification(response);

      if (response?.result?.evidenceSufficiency === "technical_failure" || response?.result?.technicalFailure) {
        setIsTechnicalFailure(true);
      }
    } catch (requestError) {
      setError(getVerificationErrorMessage(requestError));
      if (requestError.status === 503) {
        setIsTechnicalFailure(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const useDemoClaim = () => {
    setClaim(demoClaim);
    setVerification(null);
    setError("");
    setIsTechnicalFailure(false);
  };

  return (
    <main>
      <section className="bg-slate-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Information verification"
            title="Check before you share."
            description="Submit a claim, message, or piece of information and Sauti Salama will help you understand what is known, what remains uncertain, and what evidence should be checked."
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                  <Search size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    What would you like to check?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Paste a message, claim, or statement below.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheck} className="mt-8">
                <label htmlFor="claim" className="mb-2 block text-sm font-semibold text-slate-700">
                  Information to verify
                </label>

                <textarea
                  id="claim"
                  value={claim}
                  onChange={(event) => {
                    setClaim(event.target.value);
                    setVerification(null);
                    setError("");
                    setIsTechnicalFailure(false);
                  }}
                  rows={7}
                  maxLength={2000}
                  placeholder="Example: I received a message saying..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Do not include passwords or other sensitive information.</span>
                  <span>{claim.length}/2000</span>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    variant="primary"
                    className="justify-center"
                    disabled={isSubmitting || !claim.trim()}
                    aria-busy={isSubmitting}
                  >
                    <ShieldCheck size={18} />
                    {isSubmitting ? "Assessing information..." : "Check Information"}
                  </Button>

                  <button
                    type="button"
                    onClick={useDemoClaim}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Try a demo claim
                  </button>
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </form>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Info size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    How verification works
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Verification is designed to provide context, not amplify rumors.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-800">Evidence first</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Relevant sources and available evidence are considered before a claim is classified.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-800">Time matters</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Information can change. Results should show when supporting evidence was checked.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 shrink-0 text-orange-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-800">Uncertainty is visible</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      An unverified claim is not automatically false. The platform clearly communicates uncertainty.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {isTechnicalFailure && (
        <section className="bg-slate-50 py-12">
          <Container>
            <Card className="overflow-hidden border-red-200">
              <div className="border-b border-red-100 bg-red-50 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 shrink-0 text-red-600" size={24} aria-hidden="true" />
                  <div>
                    <h2 className="text-xl font-semibold text-red-900">Verification temporarily unavailable</h2>
                    <p className="mt-2 text-sm leading-6 text-red-800">
                      We could not retrieve evidence at this time. This does not mean the claim is true or false.
                      Please try again later.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-sm text-slate-600">
                  If this problem continues, contact the system administrator.
                </p>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {verification?.data?.result && !isTechnicalFailure && (
        <VerificationResult claim={claim} result={verification.data.result} />
      )}
    </main>
  );
}
