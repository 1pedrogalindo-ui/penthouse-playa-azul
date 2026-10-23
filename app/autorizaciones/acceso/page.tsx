import { AccessForm } from "../access-form";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export default function AuthorizationAccessPage() {
  if (process.env.GITHUB_ACTIONS === "true") notFound();
  return <Suspense fallback={null}><AccessForm /></Suspense>;
}
