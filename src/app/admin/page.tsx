import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import AdminDashboard from "../_components/AdminDashboard";

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user) redirect("/sign-in");
    if (session.user.role !== "admin") redirect("/");

    return <AdminDashboard />;
}