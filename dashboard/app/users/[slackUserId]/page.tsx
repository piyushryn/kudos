import { redirect } from "next/navigation";

export default async function UserStatsPage() {
  redirect("/me");
}
