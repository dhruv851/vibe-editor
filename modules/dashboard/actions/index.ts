"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";
import { TemplateType } from "../types";
import { revalidatePath } from "next/cache";

export const toggleStarMarked = async (id: string, isChecked: boolean) => {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
        throw new Error("User Id is required");
    }
    try {
       if(isChecked){
        await db.starMark.create({
            data: {
                playgroundId: id,
                userId: userId,
                isChecked: true,
            },
        });
         } else {
            await db.starMark.delete({
            where: {
                userId_playgroundId: {
                    playgroundId: id,
                    userId: userId,
                },
            },
        });
       }
       revalidatePath("/dashboard");
       return { success: true, isMarked: isChecked };
    } catch (error) {
        console.error("Error toggling star mark:", error);
        throw error;
    }
};

export const getAllPlaygroundForUser = async () => {
  const user = await currentUser();
  try {
    const playground = await db.playground.findMany({
      where: {
        userId: user?.id,
      },

      include: {
        user: true,
        Starmark: {
            where: {
                userId: user?.id!,
        },
        select: {
            isMarked: true
        }
      }
    }
    });
    return playground;
  } catch (error) {
    console.error("Error fetching playgrounds:", error);
    throw error;
  }
};

export const createPlayground = async (data: {
  title: string;
  template: TemplateType;
  description?: string;
}) => {
  const user = await currentUser();
  const { template, title, description } = data;
  try {
    const playground = await db.playground.create({
      data: {
        title: title,
        description: description,
        template: template,
        userId: user?.id!,
      },
    });
    return playground;
  } catch (error) {
    console.error("Error creating playground:", error);
    throw error;
  }
};

export const deleteProjectById = async (id: string) => {
  try {
    await db.playground.delete({
      where: {
        id,
      },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error deleting playground:", error);
    throw error;
  }
};

export const editProjectById = async (
  id: string,
  data: {
    title?: string;
    description?: string;
  }
) => {
  try {
    await db.playground.update({
      where: { id },
      data: data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error updating playground:", error);
    throw error;
  }
};

export const duplicateProjectById = async (id: string) => {
  try {
    const originalPlayground = await db.playground.findUnique({
      where: { id },
      // todo : add template file
    });
    if (!originalPlayground) {
      throw new Error("Project not found");
    }

    const duplicatedPlayground = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId: originalPlayground.userId,
        //todo : add template file
      },
    });
    revalidatePath("/dashboard");
    return duplicatedPlayground;
  } catch (error) {
    console.error("Error duplicating playground:", error);
    throw error;
  }
};
