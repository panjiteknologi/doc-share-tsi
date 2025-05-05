import prisma from "@/lib/prisma";

async function main() {
  // Data roles
  const roles = [
    { code: "surveyor", name: "Lembaga Sertifikasi" },
    { code: "client", name: "Client" },
    { code: "auditor", name: "Auditor" },
  ];

  // Upsert roles
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }

  console.log("Roles seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
