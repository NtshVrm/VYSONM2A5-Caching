export const responseJson = {
  userNotFound: { statusCode: 404, error: "User does not exist." },
  shortCodeRequired: { statusCode: 400, error: "Short code is required." },
  shortCodeNotFound: {
    statusCode: 404,
    error: "Short code does not exist.",
  },
  apiKeyRequired: { statusCode: 403, error: "API key is required." },
  accessDenied: {
    statusCode: 400,
    error: "You do not have access for this operation.",
  },
  shortCodeExpired: { statusCode: 410, error: "Short code has expired!" },
  needsPassword: { statusCode: 403, error: "Needs a password to be accessed." },
  incorrectPassword: { statusCode: 403, error: "The password is incorrect." },
  originalUrlRequired: {
    statusCode: 400,
    error: "Original long URL is required!",
  },
  customCodeEmpty: { statusCode: 400, error: "Custom Code cannot be empty!" },
  passwordEmpty: { statusCode: 400, error: "Password cannot be empty!" },
  shortCodeExists: {
    statusCode: 400,
    error: "Short code already exists, please try with a different code.",
  },
  deleteSuccess: (short_code: string) => ({
    statusCode: 200,
    message: `${short_code} deleted successfully!`,
  }),
};
