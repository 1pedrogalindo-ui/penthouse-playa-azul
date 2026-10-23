import { AuthorizationGenerator } from "./authorization-generator";
import { notFound } from "next/navigation";

export default function AuthorizationsPage() {
  if (process.env.GITHUB_ACTIONS === "true") notFound();
  return <AuthorizationGenerator />;
}
