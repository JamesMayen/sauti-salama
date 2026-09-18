import AppError from "./AppError.js";

const southSudanPattern = /^\+2119\d{8}$/;

export function normalizeSouthSudanPhone(value) {
  if (typeof value !== "string") {
    throw new AppError(
      "A valid South Sudan phone number is required.",
      400,
      "INVALID_PHONE_NUMBER"
    );
  }

  const compact = value.trim().replace(/[\s().-]/g, "");
  let normalized = compact;

  if (/^2119\d{8}$/.test(compact)) {
    normalized = `+${compact}`;
  } else if (/^09\d{8}$/.test(compact)) {
    normalized = `+211${compact.slice(1)}`;
  }

  if (!southSudanPattern.test(normalized)) {
    throw new AppError(
      "Enter a valid South Sudan phone number.",
      400,
      "INVALID_PHONE_NUMBER"
    );
  }

  return normalized;
}

export function maskPhoneNumber(value) {
  if (!value || typeof value !== "string") {
    return "Not available";
  }

  if (value.length <= 4) {
    return value;
  }

  return `${value.slice(0, 4)} ****${value.slice(-4)}`;
}
