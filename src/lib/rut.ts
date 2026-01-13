/**
 * Chilean RUT (Rol Único Tributario) utilities
 * Format: XX.XXX.XXX-X (e.g., 12.345.678-9)
 */

/**
 * Formats a RUT string to the standard format XX.XXX.XXX-X
 * Handles partial input during typing
 */
export function formatRut(value: string): string {
  // Remove all non-alphanumeric characters
  let cleaned = value.replace(/[^0-9kK]/g, "").toUpperCase();

  // Limit length (max 9 characters: 8 digits + 1 verification digit)
  if (cleaned.length > 9) {
    cleaned = cleaned.slice(0, 9);
  }

  // If empty, return empty
  if (cleaned.length === 0) {
    return "";
  }

  // Split into body and verification digit
  let body = cleaned;
  let verificationDigit = "";

  if (cleaned.length > 1) {
    body = cleaned.slice(0, -1);
    verificationDigit = cleaned.slice(-1);
  }

  // Format body with dots (thousands separators)
  let formattedBody = "";
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = "." + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }

  // Combine with verification digit
  if (verificationDigit) {
    return `${formattedBody}-${verificationDigit}`;
  }

  return formattedBody;
}

/**
 * Cleans a RUT string to just numbers and K
 */
export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

/**
 * Validates a Chilean RUT using the verification digit algorithm
 */
export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);

  if (cleaned.length < 2) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const providedDigit = cleaned.slice(-1);

  // Calculate expected verification digit
  const expectedDigit = calculateVerificationDigit(body);

  return providedDigit === expectedDigit;
}

/**
 * Calculates the verification digit for a RUT body
 * Uses the Module 11 algorithm
 */
export function calculateVerificationDigit(rutBody: string): string {
  const cleanBody = rutBody.replace(/\D/g, "");

  if (cleanBody.length === 0) {
    return "";
  }

  let sum = 0;
  let multiplier = 2;

  // Process digits from right to left
  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);

  if (remainder === 11) {
    return "0";
  } else if (remainder === 10) {
    return "K";
  }

  return remainder.toString();
}
