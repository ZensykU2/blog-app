"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { Trash2, Users, FileText, MessageSquare } from "lucide-react";
import { DeleteConfirmationModal } from "../Shared/DeleteConfirmationModal";

export default function AdminDashboard() {
    const utils = api.useUtils();
    const { data: stats } = api.admin.getStats.useQuery();
    const { data: users, isLoading } = api.admin.getUsers.useQuery();

    const deleteUser = api.admin.deleteUser.useMutation({
        onSuccess: () => {
            toast.success("User deleted");
            void utils.admin.getUsers.invalidate();
            void utils.admin.getStats.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const updateRole = api.admin.updateUserRole.useMutation({
        onSuccess: () => {
            toast.success("Role updated");
            void utils.admin.getUsers.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    return (
        <main className="min-h-screen p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-black text-white mb-8">
                Admin Dashboard
            </h1>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="glass-panel p-6 rounded-xl">
                        <Users className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                            {stats.users}
                        </p>
                        <p className="text-slate-400 text-sm">Users</p>
                    </div>
                    <div className="glass-panel p-6 rounded-xl">
                        <FileText className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                            {stats.posts}
                        </p>
                        <p className="text-slate-400 text-sm">Posts</p>
                    </div>
                    <div className="glass-panel p-6 rounded-xl">
                        <MessageSquare className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">
                            {stats.comments}
                        </p>
                        <p className="text-slate-400 text-sm">Comments</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Users</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-400">
                        Loading...
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    User
                                </th>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    Email
                                </th>
                                <th className="text-left p-4 text-slate-400 font-medium">
                                    Role
                                </th>
                                <th className="text-right p-4 text-slate-400 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t border-white/5"
                                >
                                    <td className="p-4">
                                        <p className="text-white font-medium">
                                            {user.displayName}
                                        </p>
                                        <p className="text-slate-500 text-sm">
                                            @{user.username}
                                        </p>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {user.email}
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                { updateRole.mutate({
                                                    userId: user.id,
                                                    role: e.target.value as
                                                        | "admin"
                                                        | "author"
                                                        | "user",
                                                }); }
                                            }
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm"
                                        >
                                            <option value="user">User</option>
                                            <option value="author">
                                                Author
                                            </option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() =>
                                                { setUserToDelete(user.id); }
                                            }
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => { setUserToDelete(null); }}
                onConfirm={() => {
                    if (userToDelete) {
                        deleteUser.mutate({ userId: userToDelete });
                        setUserToDelete(null);
                    }
                }}
                isDeleting={deleteUser.isPending}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
            />
        </main>
    );
}