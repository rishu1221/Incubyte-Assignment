import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { AppError } from "../utils/AppError";

export function rethrowKnownPrismaError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError("Email already exists", 409);
    }
    if (error.code === "P2003") {
      throw new AppError("Country, department, level, or currency does not exist", 400);
    }
  }
  throw error;
}
