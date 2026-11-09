/*
  Warnings:

  - The values [user,assistant] on the enum `MessageRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [result,error] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageRole_new" AS ENUM ('USER', 'ASSISTANT');
ALTER TABLE "Message" ALTER COLUMN "role" TYPE "MessageRole_new" USING ("role"::text::"MessageRole_new");
ALTER TYPE "MessageRole" RENAME TO "MessageRole_old";
ALTER TYPE "MessageRole_new" RENAME TO "MessageRole";
DROP TYPE "public"."MessageRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('RESULT', 'ERROR');
ALTER TABLE "Message" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "public"."MessageType_old";
COMMIT;
