"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  getConnections,
  addConnection,
  updateConnection,
  deleteConnection,
  setActiveConnectionId,
  CONNECTION_CHANGED_EVENT,
  type FaunaConnection,
} from "@/utils/fauna-auth-store";
import { CheckIcon, PlusIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { cn } from "@/utils/class-names";

function notifyConnectionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED_EVENT));
  }
}

const DEFAULT_ENDPOINT = "http://localhost:8443";

function maskEndpoint(url: string): string {
  try {
    const u = new URL(url.trim());
    if (u.hostname.length > 12) {
      return `${u.origin.replace(u.hostname, u.hostname.slice(0, 6) + "…")}`;
    }
    return u.origin;
  } catch {
    return "—";
  }
}

type ConnectionFormState = {
  name: string;
  endpoint: string;
  secret: string;
};

const emptyForm: ConnectionFormState = {
  name: "",
  endpoint: DEFAULT_ENDPOINT,
  secret: "",
};

export default function HomePage() {
  const [data, setData] = useState<ReturnType<typeof getConnections>>({ connections: [], activeId: null });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConnectionFormState>(emptyForm);

  const refresh = () => setData(getConnections());

  useEffect(() => {
    refresh();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (conn: FaunaConnection) => {
    setEditingId(conn.id);
    setForm({
      name: conn.name,
      endpoint: conn.endpoint,
      secret: "",
    });
    setDialogOpen(true);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const endpoint = form.endpoint.trim();
    const secret = form.secret.trim();
    if (!name || !endpoint) return;
    if (editingId) {
      const patch: Partial<Omit<FaunaConnection, "id">> = { name, endpoint };
      if (secret) patch.secret = secret;
      updateConnection(editingId, patch);
    } else {
      if (!secret) return;
      addConnection({ name, endpoint, secret }, true);
    }
    notifyConnectionChanged();
    refresh();
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleActivate = (id: string) => {
    setActiveConnectionId(id);
    notifyConnectionChanged();
    refresh();
  };

  const handleDelete = (id: string) => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Delete this connection?")) return;
    deleteConnection(id);
    notifyConnectionChanged();
    refresh();
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-row items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="h2 text-gray-12 mb-1">Connections</h1>
          <p className="text-sm text-gray-11">
            Manage Fauna connections. The active connection is used for Nodes, Collections, and Shell.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="icon" aria-hidden />
          New connection
        </Button>
      </div>

      {data.connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-md border border-gray-6 bg-gray-2 text-center">
          <p className="text-gray-11">No connections yet.</p>
          <Button onClick={openCreate}>
            <PlusIcon className="icon" aria-hidden />
            Create a connection
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {data.connections.map((conn) => {
            const isActive = data.activeId === conn.id;
            return (
              <li
                key={conn.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-md border bg-gray-2 min-w-0",
                  isActive ? "border-accent-7 bg-accent-2" : "border-gray-6"
                )}
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-12 truncate">{conn.name}</p>
                    <p className="text-xs text-gray-11 font-mono truncate" title={conn.endpoint}>
                      {maskEndpoint(conn.endpoint)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="link"
                      size="icon"
                      aria-label={`Edit ${conn.name}`}
                      onClick={() => openEdit(conn)}
                    >
                      <Pencil1Icon className="icon" />
                    </Button>
                    <Button
                      variant="link"
                      size="icon"
                      aria-label={`Delete ${conn.name}`}
                      onClick={() => handleDelete(conn.id)}
                      className="text-red-11 hover:text-red-12"
                    >
                      <TrashIcon className="icon" />
                    </Button>
                  </div>
                </div>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs text-accent-11">
                    <CheckIcon className="icon" aria-hidden />
                    Active
                  </span>
                ) : (
                  <Button variant="pill" size="sm" onClick={() => handleActivate(conn.id)}>
                    Activate
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit connection" : "New connection"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConnection} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="conn-name">Name</Label>
              <Input
                id="conn-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Local Fauna"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="conn-endpoint">Endpoint</Label>
              <Input
                id="conn-endpoint"
                type="url"
                value={form.endpoint}
                onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
                placeholder={DEFAULT_ENDPOINT}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="conn-secret">Secret</Label>
              <Input
                id="conn-secret"
                type="password"
                value={form.secret}
                onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
                placeholder={editingId ? "Leave blank to keep current" : "Your database secret"}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
            <DialogFooter className="flex-shrink-0 gap-2">
              <Button type="button" variant="pill" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim() || !form.endpoint.trim() || (!form.secret.trim() && !editingId)}
              >
                {editingId ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
