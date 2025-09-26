"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { TemplateFolder } from "../lib/path-to-json";

export const getPlaygroundById = async (id: string) => {
  try {
    const playground = await db.playground.findUnique({
      where: { id },
      select: {
        title: true,
        templateFiles: {
          select: {
            content: true,
          },
        },
      },
    });
    return playground;
  } catch (error) {
    console.error("Error fetching playground:", error);
    throw new Error("Failed to fetch playground");
  }
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  const user = await currentUser();
  if (!user) return null;

  try {
    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId,
      },
      update: {
        content: JSON.stringify(data),
      },
      create: {
        playgroundId,
        content: JSON.stringify(data),
      },
    });

    return updatedPlayground;
  } catch (error) {
    console.log("SaveUpdatedCode error:", error);
    return null;
  }
};
