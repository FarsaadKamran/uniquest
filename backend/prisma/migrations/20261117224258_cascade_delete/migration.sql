-- DropForeignKey
ALTER TABLE "ModuleEnrollment" DROP CONSTRAINT "ModuleEnrollment_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleEnrollment" DROP CONSTRAINT "ModuleEnrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleLecturer" DROP CONSTRAINT "ModuleLecturer_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleLecturer" DROP CONSTRAINT "ModuleLecturer_moduleId_fkey";

-- AddForeignKey
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleEnrollment" ADD CONSTRAINT "ModuleEnrollment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleLecturer" ADD CONSTRAINT "ModuleLecturer_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleLecturer" ADD CONSTRAINT "ModuleLecturer_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
