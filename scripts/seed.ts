// Usage: npm run seed   (reads .env.local - needs MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD)
// Safe to run again at any time: it only adds what is missing.
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { seedCategories } from "../src/lib/category-seed";
import { User } from "../src/lib/models/User";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing (put it in .env.local)");
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  if (password.length < 6) throw new Error("ADMIN_PASSWORD must be at least 6 characters");

  await connectDB();
  await User.init(); // make sure the unique email index exists

  // The old role name "member" is now called "editor".
  const migrated = await User.updateMany({ role: "member" }, { $set: { role: "editor" } });
  if (migrated.modifiedCount) console.log(`Renamed role member -> editor for ${migrated.modifiedCount} user(s)`);

  await seedCategories();
  console.log("Vendor categories ready");

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email} (nothing changed)`);
  } else {
    await User.create({
      name: "Admin",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
      side: "bride",
    });
    console.log(`Admin created: ${email}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
