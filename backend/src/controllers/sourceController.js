import mongoose from "mongoose";

import {
  createSource,
  getSources,
  getSourceById,
  updateSource,
} from "../services/sourceService.js";

export async function createSourceController(
  req,
  res
) {
  try {
    const {
      name,
      type,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message:
          "Source name and type are required.",
      });
    }

    const source = await createSource(req.body);

    return res.status(201).json({
      success: true,
      message: "Source created successfully.",
      data: source,
    });
  } catch (error) {
    console.error("Create source error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create source.",
    });
  }
}

export async function getSourcesController(
  req,
  res
) {
  try {
    const sources = await getSources(req.query);

    return res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    console.error("Get sources error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sources.",
    });
  }
}

export async function getSourceController(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source ID.",
      });
    }

    const source = await getSourceById(id);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Source not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error("Get source error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve source.",
    });
  }
}

export async function updateSourceController(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source ID.",
      });
    }

    const source = await updateSource(
      id,
      req.body
    );

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Source not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Source updated successfully.",
      data: source,
    });
  } catch (error) {
    console.error("Update source error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update source.",
    });
  }
}