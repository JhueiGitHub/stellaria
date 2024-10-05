import { currentUser, redirectToSignIn } from "@clerk/nextjs";
import { db } from "@/lib/db";

export const initialProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return redirectToSignIn();
  }

  const profile = await db.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (profile) {
    return profile;
  }

  // Use a transaction to ensure all related records are created
  const newProfile = await db.$transaction(async (prisma) => {
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    // Create the Zenith design system
    // This aligns with the "Design Tokens" concept in our blueprint
    const zenithDesignSystem = await prisma.designSystem.create({
      data: {
        name: "Zenith",
        profileId: profile.id,
        colorTokens: {
          createMany: {
            data: [
              { name: "Underlying BG", value: "#292929", opacity: 81 },
              { name: "Overlaying BG", value: "#010203", opacity: 69 },
              { name: "Brd", value: "#292929", opacity: 81 },
              { name: "Black", value: "#000000", opacity: 100 }, // Solid fill, no opacity
              { name: "Glass", value: "#000000", opacity: 30 }, // New Glass token
              { name: "White", value: "#CCCCCC", opacity: 69 },
              { name: "Lilac Accent", value: "#7B6CBD", opacity: 100 },
              { name: "Teal Accent", value: "#003431", opacity: 100 },
              { name: "Text Primary (Hd)", value: "#ABC4C3", opacity: 100 },
              { name: "Text Secondary (Bd)", value: "#748393", opacity: 100 },
            ],
          },
        },
        typographyTokens: {
          createMany: {
            data: [
              { name: "Text Primary", fontFamily: "Arial" },
              { name: "Text Secondary", fontFamily: "Inter" },
            ],
          },
        },
      },
    });

    // Create initial flow
    await prisma.flow.create({
      data: {
        name: "Zenith",
        description: "Default Zenith flow",
        profileId: profile.id,
        designSystemId: zenithDesignSystem.id,
      },
    });

    // Create root folder for the user
    // This aligns with the "Initial Setup" section in our blueprint
    const rootFolder = await prisma.folder.create({
      data: {
        name: "Desktop", // Changed from "Root" to "Desktop" as per the blueprint
        path: "/Desktop", // Add path for the root folder
        profileId: profile.id, // Use userId instead of profileId as per the new Prisma schema
        isFavorite: true, // Make the Desktop folder a favorite by default
      },
    });

    // Create initial welcome file in the Desktop folder
    await prisma.file.create({
      data: {
        name: "Welcome.txt",
        path: "/Desktop/Welcome.txt", // Include the full path
        mimeType: "text/plain", // Changed from 'type' to 'mimeType' as per the new schema
        size: 23, // Size of the content in bytes
        folderId: rootFolder.id,
        profileId: profile.id, // Use userId instead of profileId
      },
    });

    return profile;
  });

  return newProfile;
};
