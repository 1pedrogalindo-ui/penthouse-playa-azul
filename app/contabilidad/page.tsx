import type { Metadata } from "next";
import { AccountingDashboard } from "@/components/accounting-dashboard";

export const metadata: Metadata = { title: "Contabilidad PH 1401", robots: { index: false, follow: false } };
export default function AccountingPage(){ return <AccountingDashboard/>; }
