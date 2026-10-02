import { z } from "zod";

export const studentDataDeletionConfirmation = "DELETE ALL STUDENT DATA";

export const studentDataDeletionConfirmationSchema = z.literal(
  studentDataDeletionConfirmation
);
