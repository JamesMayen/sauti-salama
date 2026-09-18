import readline from "readline";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import mongoose from "mongoose";

import User from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(
  __dirname,
  "../.env"
);

dotenv.config({
  path: envPath,
});

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    const fullName = await askQuestion(
      "Admin full name: "
    );

    const email = (
      await askQuestion(
        "Admin email: "
      )
    ).toLowerCase();

    const password = await askQuestion(
      "Admin password: "
    );

    if (!fullName || !email || !password) {
      throw new Error(
        "Full name, email and password are required."
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters."
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "Connected to MongoDB."
    );

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log(
          "An admin account with this email already exists."
        );
      } else {
        console.log(
          `A user already exists with this email. Current role: ${existingUser.role}`
        );
      }

      await mongoose.disconnect();
      return;
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const admin =
      await User.create({
        fullName,
        email,
        passwordHash,
        role: "admin",
        isActive: true,
      });

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "Admin account created successfully."
    );
    console.log(
      "===================================="
    );
    console.log(
      `Name: ${admin.fullName}`
    );
    console.log(
      `Email: ${admin.email}`
    );
    console.log(
      `Role: ${admin.role}`
    );
    console.log("");

    await mongoose.disconnect();
  } catch (error) {
    console.error(
      "Failed to create admin:",
      error.message
    );

    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();