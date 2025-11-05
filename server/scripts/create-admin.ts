import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@gemalery.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";

  console.log(`Creating admin user: ${email}`);

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role === "admin") {
        console.log(`Admin user already exists: ${email}`);
        console.log(`To update password, please delete and recreate the user.`);
        return;
      } else {
        // Update existing user to admin
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "admin", password: hashed, name }
        });
        console.log(`Updated user to admin: ${email}`);
        return;
      }
    }

    // Create new admin user
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "admin",
        name
      }
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}`);
    console.log(`ID: ${admin.id}`);
    console.log(`\n⚠️  Please change the default password after first login!`);
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

