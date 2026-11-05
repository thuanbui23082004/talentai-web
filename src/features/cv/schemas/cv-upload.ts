import { z } from "zod";
import { cvFileError } from "@/lib/api/cv-schemas";

export const cvUploadSchema = z.file().superRefine((file, context) => {
    const error = cvFileError(file);
    if (error) context.addIssue({ code: "custom", message: error });
});
