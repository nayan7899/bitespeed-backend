import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { Contact } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

export const processIdentity = async (
  email?: string,
  phoneNumber?: string
) => {
  // 🔹 Build dynamic OR conditions safely
  const orConditions = [];

  if (email) {
    orConditions.push({ email });
  }

  if (phoneNumber) {
    orConditions.push({ phoneNumber });
  }

  // 1️⃣ Find matched contacts
  const matchedContacts = await prisma.contact.findMany({
    where: {
      OR: orConditions,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 2️⃣ If no match → create primary
  if (matchedContacts.length === 0) {
    const newPrimary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary",
      },
    });

    return buildResponse([newPrimary]);
  }

  // 3️⃣ Get full cluster
  const cluster = await getFullCluster(matchedContacts);

  // 4️⃣ Find oldest primary safely
  const primaries = cluster
    .filter(c => c.linkPrecedence === "primary")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const primary = primaries[0];

  if (!primary) {
    throw new Error("No primary contact found");
  }

  // 5️⃣ Convert extra primaries to secondary
  await Promise.all(
    cluster
      .filter(
        c => c.linkPrecedence === "primary" && c.id !== primary.id
      )
      .map(c =>
        prisma.contact.update({
          where: { id: c.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: primary.id,
          },
        })
      )
  );

  // 6️⃣ Create secondary if combination not already present
  const exists = cluster.some(
    c => c.email === email && c.phoneNumber === phoneNumber
  );

  if (!exists) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkedId: primary.id,
        linkPrecedence: "secondary",
      },
    });
  }

  const finalCluster = await getFullCluster([primary]);

  return buildResponse(finalCluster);
};

async function getFullCluster(contacts: Contact[]) {
  const primaryIds = Array.from(
    new Set(
      contacts.map(c =>
        c.linkPrecedence === "primary" ? c.id : c.linkedId ?? c.id
      )
    )
  );

  return prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: primaryIds } },
        { linkedId: { in: primaryIds } },
      ],
    },
  });
}

function buildResponse(contacts: Contact[]) {
  const primary = contacts.find(
    c => c.linkPrecedence === "primary"
  );

  if (!primary) {
    throw new Error("Primary contact missing");
  }

  return {
    contact: {
      primaryContactId: primary.id,
      emails: Array.from(
        new Set(contacts.map(c => c.email).filter(Boolean))
      ),
      phoneNumbers: Array.from(
        new Set(contacts.map(c => c.phoneNumber).filter(Boolean))
      ),
      secondaryContactIds: contacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c.id),
    },
  };
}