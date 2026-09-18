import mongoose from "mongoose";

import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
} from "../services/reportService.js";

import {
  sanitizeReport,
  sanitizeReports,
  sanitizeReportSubmission,
} from "../utils/sanitizeReport.js";

const allowedStatuses = [
  "received",
  "under_review",
  "verified",
  "unverified",
  "closed",
];

export async function createReportController(
  req,
  res
) {
  try {
    const {
      description,
      location,
      category,
    } = req.body;

    if (!description || !location || !category) {
      return res.status(400).json({
        success: false,
        message:
          "Description, location and category are required.",
      });
    }

    const report = await createReport(req.body);

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully.",
      data: sanitizeReportSubmission(report),
    });
  } catch (error) {
    console.error("Create report error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.isOperational
        ? error.message
        : "Failed to submit report.",
    });
  }
}

export async function getReportsController(
  req,
  res
) {
  try {
    const reports = await getReports(req.query);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: sanitizeReports(reports),
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reports.",
    });
  }
}

export async function getReportController(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const report = await getReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeReport(report),
    });
  } catch (error) {
    console.error("Get report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve report.",
    });
  }
}

export async function updateReportStatusController(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report status.",
      });
    }

    const report = await updateReportStatus(
      id,
      status
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Report status updated successfully.",
      data: sanitizeReport(report),
    });
  } catch (error) {
    console.error(
      "Update report status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update report status.",
    });
  }
}