import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const workspaceName = process.env.SEED_WORKSPACE_NAME ?? 'Default Workspace';
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@hengchat.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe!2026';
  const ownerName = process.env.SEED_OWNER_NAME ?? 'Workspace Owner';

  const workspace = await prisma.workspace.upsert({
    where: { id: 'seed-workspace' },
    update: { name: workspaceName },
    create: { id: 'seed-workspace', name: workspaceName },
  });

  const existing = await prisma.agent.findUnique({ where: { email: ownerEmail } });
  if (existing) {
    console.log(`Owner ${ownerEmail} already exists. Skipping.`);
  } else {
    const passwordHash = await argon2.hash(ownerPassword);
    await prisma.agent.create({
      data: {
        workspaceId: workspace.id,
        name: ownerName,
        email: ownerEmail,
        passwordHash,
        role: 'owner',
      },
    });
    console.log(`Created owner: ${ownerEmail} / ${ownerPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
