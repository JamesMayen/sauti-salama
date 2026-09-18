import mongoose from "mongoose";

import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
} from "../services/alertService.js";

const allowedStatuses = [
  "verified",
  "unverified",
  "contested",
  "emerging_signal",
];

export async function createAlertController(req, res) {
  try {
    const {
      title,
      summary,
      location,
      category,
      status,
    } = req.body;

    if (
      !title ||
      !summary ||
      !location ||
      !category ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, summary, location, category and status are required.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert status.",
      });
    }

    const alert = await createAlert(req.body);

    return res.status(201).json({
      success: true,
      message: "Alert created successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Create alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create alert.",
    });
  }
}

export async function getAlertsController(req, res) {
  try {
    const alerts = await getAlerts(req.query);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Get alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve alerts.",
    });
  }
}

export async function getAlertController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID.",
      });
    }

    const alert = await getAlertById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error("Get alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve alert.",
    });
  }
}

export async function updateAlertController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert ID.",
      });
    }

    if (
      req.body.status &&
      !allowedStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert status.",
      });
    }

    const alert = await updateAlert(id, req.body);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert updated successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Update alert error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update alert.",
    });
  }
}