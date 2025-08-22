import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChamberMemberCard } from "@/components/chamber/chamber-member-card";
import { SharedEntryCard } from "@/components/chamber/shared-entry-card";
import type { Chamber, User, DiaryEntry } from "@shared/schema";
import { useAuth } from "react-oidc-context";
import { useState } from "react";
import AddMemberPopup from "@/components/chamber/add-memeber";

export function Chamber() {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const auth = useAuth();
  const queryClient = useQueryClient();

  // Fetch chambers
  const { data: chambers = [], isLoading: isLoadingChambers } = useQuery<Chamber[]>({
    queryKey: ["/api/chambers"],
    queryFn: async () => {
      const token = auth.user?.id_token;
      const res = await fetch("/api/chambers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch chambers");
      return res.json();
    },
  });

  const chamber = chambers[0];

  // Fetch chamber members
  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["/api/chambers", chamber?.id, "members"],
    queryFn: async () => {
      const token = auth.user?.id_token;
      const res = await fetch(`/api/chambers/${chamber.id}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!chamber?.id,
  });

  // Fetch shared entries
  const { data: sharedEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/chambers", chamber?.id, "shared-entries"],
    queryFn: async () => {
      const token = auth.user?.id_token;
      const res = await fetch(`/api/chambers/${chamber.id}/shared-entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch shared entries");
      return res.json();
    },
    enabled: !!chamber?.id,
  });

  // add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const token = auth.user?.id_token;
      const response = await fetch(`/api/chambers/${chamber.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          role: "member",
        }),
      });
      if (!response.ok) throw new Error("Failed to add member");
      return response.json();
    },
  });

  // handleAddMember
  const handleAddMember = async (email: string) => {
    await addMemberMutation.mutateAsync({ email });
  };

  // Create chamber mutation
  const createChamberMutation = useMutation({
    mutationFn: async (chamberData: { name: string; description?: string }) => {
      const token = auth.user?.id_token;
      const res = await fetch("/api/chambers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(chamberData),
      });
      if (!res.ok) throw new Error("Failed to create chamber");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
    },
  });

  if (isLoadingChambers) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chamber) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-users text-2xl text-blue-600"></i>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create a Chamber</h2>
            <p className="text-gray-600 mb-6">Start collaborating with your colleagues</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              try {
                await createChamberMutation.mutateAsync({
                  name: formData.get("name") as string,
                  description: formData.get("description") as string,
                });
              } catch (error) {
                console.error("Failed to create chamber:", error);
              }
            }}>
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Chamber Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <textarea
                  name="description"
                  placeholder="Chamber Description (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={createChamberMutation.isPending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createChamberMutation.isPending ? "Creating..." : "Create Chamber"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">{chamber.name}</h1>
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <i className="fas fa-cog"></i>
            </button>
          </div>

          {/* Chamber Members Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Chamber Members ({members.length})
              </h2>
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
              >
                <i className="fas fa-user-plus"></i>
              </button>
            </div>

            <div className="space-y-3">
              {members.map(member => (
                <ChamberMemberCard key={member.id} member={member} />
              ))}
              {members.length === 0 && (
                <p className="text-center py-4 text-gray-500">No members yet</p>
              )}
            </div>
          </div>

          {/* Shared Entries Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Shared Entries</h2>
            <div className="space-y-4">
              {sharedEntries.map(entry => (
                <SharedEntryCard key={entry.id} entry={entry} />
              ))}
              {sharedEntries.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="far fa-comments text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No shared entries</h3>
                  <p className="text-gray-500">
                    Share diary entries with your chamber colleagues
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <AddMemberPopup isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} onSubmit={handleAddMember} isLoading={false} />
      </div>
    </div>
  );
  
}