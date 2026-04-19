import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = 'admin@cka.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
        staffProfile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            position: 'Administrator',
          },
        },
      },
    });
    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Seed demo parent
  const parentEmail = 'parent@cka.com';
  const existingParent = await prisma.user.findUnique({ where: { email: parentEmail } });
  if (!existingParent) {
    const passwordHash = await bcrypt.hash('Parent123!', 12);
    await prisma.user.create({
      data: {
        email: parentEmail,
        passwordHash,
        role: Role.PARENT,
        parentProfile: {
          create: { firstName: 'Demo', lastName: 'Parent', phone: '555-000-1234' },
        },
      },
    });
    console.log(`Created demo parent: ${parentEmail}`);
  }

  // Seed demo classrooms
  const rooms = [
    { name: 'Sunflower Room', ageGroupMin: 2, ageGroupMax: 3, capacity: 10 },
    { name: 'Butterfly Room', ageGroupMin: 3, ageGroupMax: 4, capacity: 12 },
    { name: 'Rainbow Room', ageGroupMin: 4, ageGroupMax: 5, capacity: 15 },
  ];

  for (const room of rooms) {
    const existingRoom = await prisma.classroom.findFirst({ where: { name: room.name } });
    if (!existingRoom) {
      await prisma.classroom.create({ data: room });
      console.log(`Created classroom: ${room.name}`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
