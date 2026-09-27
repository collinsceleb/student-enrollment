export type AdminPasswordActionState =
  | { status: "idle" }
  | { status: "error"; code: string }
  | {
      status: "success";
      temporaryPassword: string;
      email: string;
    };

export const initialAdminPasswordActionState: AdminPasswordActionState = {
  status: "idle",
};
