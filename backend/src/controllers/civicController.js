import mongoose from "mongoose";

import {
  createCivicInformation,
  getCivicInformation,
  getCivicInformationById,
  updateCivicInformation,
} from "../services/civicService.js";

export async function createCivicController(req, res) {
  try {
    const {
      title,
      summary,
      content,
      category,
    } = req.body;

    if (
      !title ||
      !summary ||
      !content ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, summary, content and category are required.",
      });
    }

    const information = await createCivicInformation(
      req.body,
      req.user?.userId
    );

    return res.status(201).json({
      success: true,
      message:
        "Civic information created successfully.",
      data: information,
    });
  } catch (error) {
    console.error("Create civic information error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.isOperational
        ? error.message
        : "Failed to create civic information.",
    });
  }
}

export async function getCivicController(req, res) {
  try {
    const filters = {
      ...req.query,
    };

    if (req.path === "/") {
      filters.published = "true";
    }

    const information =
      await getCivicInformation(filters);

    return res.status(200).json({
      success: true,
      count: information.length,
      data: information,
    });
  } catch (error) {
    console.error("Get civic information error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve civic information.",
    });
  }
}

export async function getCivicByIdController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid civic information ID.",
      });
    }

    const information = await getCivicInformationById(
      id,
      req.path.startsWith("/manage")
    );

    if (!information) {
      return res.status(404).json({
        success: false,
        message:
          "Civic information not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: information,
    });
  } catch (error) {
    console.error("Get civic information error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve civic information.",
    });
  }
}

export async function updateCivicController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid civic information ID.",
      });
    }

    const information = await updateCivicInformation(
      id,
      req.body,
      req.user?.userId
    );

    if (!information) {
      return res.status(404).json({
        success: false,
        message:
          "Civic information not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Civic information updated successfully.",
      data: information,
    });
  } catch (error) {
    console.error("Update civic information error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.isOperational
        ? error.message
        : "Failed to update civic information.",
    });
  }
}