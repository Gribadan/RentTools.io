"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

interface SettingsPanelProps {
  userRole: string;
  onClose: () => void;
}

export function SettingsPanel({ userRole, onClose }: SettingsPanelProps) {
  const isSuperAdmin = userRole === "superadmin";

  const [geminiKey, setGeminiKey] = useState("");
  const [keySaving, setKeySaving] = useState(false);
  const [keyMessage, setKeyMessage] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userError, setUserError] = useState("");

  useEffect(() => {
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setGeminiKey(data.gemini_api_key || "");
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  };

  const saveGeminiKey = async () => {
    setKeySaving(true);
    setKeyMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "gemini_api_key", value: geminiKey }),
    });
    setKeySaving(false);
    setKeyMessage(res.ok ? "Saved successfully" : "Failed to save");
    setTimeout(() => setKeyMessage(""), 2000);
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });
    if (res.ok) {
      setNewUsername("");
      setNewPassword("");
      await loadUsers();
    } else {
      const data = await res.json();
      setUserError(data.error || "Failed to add user");
    }
  };

  const deleteUser = async (id: number) => {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await loadUsers();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Manage API keys and users
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg text-xs"
          onClick={onClose}
        >
          Back
        </Button>
      </div>

      {/* Gemini API Key */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Gemini API Key
        </h2>
        <div className="rounded-xl border border-border/60 bg-card/50 p-5">
          {isSuperAdmin ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter Gemini API key..."
                  className="h-10 flex-1 rounded-xl bg-background/50 text-sm"
                />
                <Button
                  onClick={saveGeminiKey}
                  disabled={keySaving}
                  className="h-10 rounded-xl px-5"
                >
                  {keySaving ? "Saving..." : "Save"}
                </Button>
              </div>
              {keyMessage && (
                <p className="text-xs text-primary">{keyMessage}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              API key: {geminiKey || "Not configured"}
            </p>
          )}
        </div>
      </section>

      {/* User Management */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Users
        </h2>

        {/* Add User Form */}
        {isSuperAdmin && (
          <div className="mb-4 rounded-xl border border-border/60 bg-card/50 p-5">
            <form onSubmit={addUser} className="flex gap-2">
              <Input
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="h-10 flex-1 rounded-xl bg-background/50 text-sm"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 flex-1 rounded-xl bg-background/50 text-sm"
                required
              />
              <Button type="submit" className="h-10 rounded-xl px-5">
                Add User
              </Button>
            </form>
            {userError && (
              <p className="mt-2 text-xs text-destructive">{userError}</p>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Username</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Created</TableHead>
                {isSuperAdmin && <TableHead className="w-10"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-border/30">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "superadmin" ? "default" : "secondary"}
                      className="rounded-md text-xs"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {user.role !== "superadmin" && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="rounded-md p-1.5 text-muted-foreground/50 transition-all hover:bg-destructive/15 hover:text-destructive"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
