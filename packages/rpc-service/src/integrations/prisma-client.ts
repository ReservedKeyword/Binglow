import { getPrismaClient } from "@binglow/prisma";
import { serviceEnvironment } from "./environment";

const { NODE_ENV } = serviceEnvironment;

export const prismaClient = getPrismaClient({ nodeEnvironment: NODE_ENV });
