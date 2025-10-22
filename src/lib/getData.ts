import { db } from "./prisma";

export async function getUserData(userId: string, selected: string) {
  switch (selected) {
    case "perfil":
      return db.user.findUnique({ where: { id: userId } });
    case "posts":
      return db.post.findMany({ where: { userId }, include: { category: true } });
    case "employees":
      return db.employee.findMany({ where: { userId } });
    case "categories":
      return db.category.findMany({ where: { userId }, include: { posts: true } });
    default:
      return null;
  }
}