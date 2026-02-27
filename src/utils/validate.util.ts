export function validateInput(email?: string, phoneNumber?: string) {
  if (!email && !phoneNumber) {
    return "Either email or phoneNumber must be provided";
  }

  if (email && typeof email !== "string") {
    return "Email must be a string";
  }

  if (phoneNumber && typeof phoneNumber !== "string") {
    return "Phone number must be a string";
  }

  return null;
}