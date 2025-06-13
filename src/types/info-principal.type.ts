import { z } from "zod/v4";
import { infoPrincipalFormSchema } from "@/components/pages/InfoPrincipal/components/FormInfoPrincipal";

export type InfoPrincipalType = z.infer<typeof infoPrincipalFormSchema>;