import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export const currentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  // Fetch the profile with associated design system and folders
  // This aligns with the "Prisma Schema" section in our blueprint
  const profile = await db.profile.findUnique({
    where: {
      id: userId,
    },
    include: {
      folders: {
        where: {
          isFavorite: true,
        },
      },
      designSystems: {
        include: {
          colorTokens: true,
          typographyTokens: true,
        },
      },
    },
  });

  return profile;
};
