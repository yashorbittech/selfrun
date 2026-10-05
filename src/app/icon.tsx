import { renderCompanyIcon } from "@/lib/platform/branding/icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return renderCompanyIcon(64);
}
