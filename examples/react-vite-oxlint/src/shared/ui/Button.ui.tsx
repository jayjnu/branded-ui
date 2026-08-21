import type { ComponentProps } from "react";
import { pureUI } from "@jayjnu/branded-ui-react";

export const ButtonUI = pureUI(({ type = "button", ...props }: ComponentProps<"button">) => (
  <button type={type} {...props} />
));
