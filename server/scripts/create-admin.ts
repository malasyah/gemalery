import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@gemalery.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin";
  const role = (process.env.USER_ROLE || "admin") as "admin" | "staff";

  console.log(`Creating ${role} user: ${email}`);

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role === role) {
        console.log(`${role} user already exists: ${email}`);
        console.log(`To update password, please delete and recreate the user.`);
        return;
      } else {
        // Update existing user to specified role
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: existing.id },
          data: { role, password: hashed, name }
        });
        console.log(`Updated user to ${role}: ${email}`);
        return;
      }
    }

    // Create new user
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role,
        name
      }
    });

    console.log(`✅ ${role} user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ${role}`);
    console.log(`ID: ${user.id}`);
    console.log(`\n⚠️  Please change the default password after first login!`);
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

