import { NewTenderForm } from "./NewTenderForm";
import { getActiveOrganization } from "@/lib/org";

export const metadata = { title: "Nouvel appel d'offres" };

export default async function NewTenderPage() {
  const org = await getActiveOrganization();
  return <NewTenderForm organizationId={org.id} />;
}
