import 'dotenv/config';
import { PrismaClient, Role } from '../src/generated/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@puente.com';
  const password = 'password123';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    console.log(`Creating user: ${email}`);
    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
    console.log(`User created with id: ${user.id}`);
  } else {
    console.log(`User ${email} already exists.`);
    // Optionally update password if needed
    // const hashedPassword = await argon2.hash(password);
    // await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
    // console.log('Password updated.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
