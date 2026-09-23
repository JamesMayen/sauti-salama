import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env.js is located at:
// backend/src/config/env.js
//
// Therefore ../../.env points to:
// backend/.env
const envPath = path.resolve(
  __dirname,
  "../../.env"
);

const result = dotenv.config({
  path: envPath,
});

if (result.error) {
  console.error(
    `Failed to load environment file: ${envPath}`
  );

  console.error(result.error.message);
} else {
  console.log(
    `Environment loaded from: ${envPath}`
  );
}

const requiredEnvironmentVariables = [
  "MONGO_URI",
  "JWT_SECRET",
  "OPENAI_API_KEY",
];

const optionalEnvironmentVariables = [
  "SEARCH_API_KEY",
  "SERPAPI_KEY",
];

export function validateEnvironment() {
  const missingVariables =
    requiredEnvironmentVariables.filter(
      (variable) =>
        !process.env[variable] ||
        !process.env[variable].trim()
    );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(
        ", "
      )}`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long."
    );
  }

  if (
    !process.env.OPENAI_API_KEY.startsWith("sk-") &&
    !process.env.OPENAI_API_KEY.startsWith("sk-proj-")
  ) {
    throw new Error(
      "OPENAI_API_KEY must be a valid OpenAI API key."
    );
  }

  console.log(
    "Environment variables validated successfully."
  );

  console.log(
    "Online evidence retrieval: enabled (DuckDuckGo default, SerpAPI optional)"
  );
}