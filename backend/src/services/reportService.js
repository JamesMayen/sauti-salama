import Report from "../models/Report.js";
import { normalizeReportInput } from "../utils/sanitizeReport.js";
import { normalizeSouthSudanPhone } from "../utils/phoneNumber.js";
import { acknowledgeReport, sendSMS } from "./smsService.js";

export async function createReport(data) {
  const normalizedData = normalizeReportInput(data);
  const contactPhone = normalizedData.contactPhone
    ? normalizeSouthSudanPhone(normalizedData.contactPhone)
    : null;

  const report = await Report.create({
    description: normalizedData.description,
    location: normalizedData.location,
    incidentDate: normalizedData.incidentDate || null,
    category: normalizedData.category,
    urgency: normalizedData.urgency || "medium",
    contactName: normalizedData.contactName || null,
    contactPhone,
    contactEmail: normalizedData.contactEmail || null,
    isAnonymous:
      normalizedData.isAnonymous !== undefined
        ? normalizedData.isAnonymous
        : true,
  });

  if (contactPhone) {
    try {
      await acknowledgeReport({
        reportId: report._id,
        phone: contactPhone,
      });
    } catch {
      // Report submission remains successful when optional SMS is unavailable.
    }
  }

  return report;
}

export async function getReports(filters = {}) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.urgency) {
    query.urgency = filters.urgency;
  }

  if (filters.location) {
    query.location = {
      $regex: filters.location,
      $options: "i",
    };
  }

  return Report.find(query)
    .populate("reviewedBy", "fullName email role")
    .sort({ createdAt: -1 });
}

export async function getReportById(id) {
  return Report.findById(id).populate(
    "reviewedBy",
    "fullName email role"
  );
}

export async function updateReportStatus(id, status) {
  const report = await Report.findByIdAndUpdate(
    id,
    {
      status,
      reviewedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (report?.contactPhone) {
    try {
      await sendSMS({
        to: report.contactPhone,
        message: `Sauti Salama: Report ${String(report._id).slice(-8)} has been reviewed. Sign in to view the current status.`,
        messageType: "report_status",
        sourceType: "report",
        sourceId: report._id,
        metadata: { reportId: report._id },
      });
    } catch {
      // Status updates remain successful when optional SMS is unavailable.
    }
  }

  return report;
}