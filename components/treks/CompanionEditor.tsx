"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TREK_LIMITS } from "@/convex/lib/treks";
import type { TrekViewCompanion } from "./TrekView";

export type CompanionInput =
  | { kind: "user"; userId: Id<"users"> }
  | { kind: "name"; name: string };

interface CompanionEditorProps {
  ownerId: Id<"users">;
  companions: TrekViewCompanion[];
  onChange: (companions: CompanionInput[]) => Promise<boolean>;
}

function toInput(companion: TrekViewCompanion): CompanionInput {
  return companion.kind === "user"
    ? { kind: "user", userId: companion.userId as Id<"users"> }
    : { kind: "name", name: companion.name };
}

export default function CompanionEditor({ ownerId, companions, onChange }: CompanionEditorProps) {
  const [text, setText] = useState("");
  // The server replaces the whole list, so a second save built from stale props would drop entries.
  const [pending, setPending] = useState(false);
  const term = text.trim();
  const matches = useQuery(api.users.searchUsers, term.length >= 2 ? { searchTerm: term } : "skip");

  const linkedIds = new Set(
    companions.flatMap((c) => (c.kind === "user" ? [c.userId] : []))
  );
  const suggestions = (matches ?? [])
    .filter((user) => user._id !== ownerId && !linkedIds.has(user._id))
    .slice(0, 5);
  const full = companions.length >= TREK_LIMITS.companionsMax;

  async function save(next: CompanionInput[]) {
    if (pending) return false;
    setPending(true);
    try {
      return await onChange(next);
    } finally {
      setPending(false);
    }
  }

  async function add(companion: CompanionInput) {
    if (await save([...companions.map(toInput), companion])) setText("");
  }

  function removeAt(index: number) {
    void save(companions.filter((_, i) => i !== index).map(toInput));
  }

  function addTypedName() {
    if (term.length > 0) void add({ kind: "name", name: term });
  }

  return (
    <div className="space-y-2 border-t pt-4">
      <Label htmlFor="companion-search" className="font-medium">
        Companions
      </Label>
      {companions.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {companions.map((companion, index) => {
            const label =
              companion.kind === "user" ? `@${companion.username}` : companion.name;
            return (
              <li
                key={companion.kind === "user" ? companion.userId : `name-${index}`}
                className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm dark:bg-gray-800"
              >
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  disabled={pending}
                  className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
                  onClick={() => removeAt(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {full ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          You can add up to {TREK_LIMITS.companionsMax} companions.
        </p>
      ) : (
        <>
          <Input
            id="companion-search"
            value={text}
            maxLength={TREK_LIMITS.companionNameMax}
            placeholder="Search members, or type a name"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              addTypedName();
            }}
          />
          {term.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((user) => (
                <Button
                  key={user._id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => add({ kind: "user", userId: user._id })}
                >
                  Add @{user.username}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={addTypedName}
              >
                Add &ldquo;{term}&rdquo; as a name
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
