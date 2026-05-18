"use client";

import { useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export type UserOption = {
  slackUserId: string;
  displayName: string;
};

const normalize = (value: string): string => value.trim().toUpperCase();

const resolveSlackUserIdToken = (raw: string, users: UserOption[]): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const idMatch = trimmed.match(/\bU[A-Z0-9]{4,}\b/i);
  if (idMatch) {
    return normalize(idMatch[0]);
  }

  const byName = users.filter((u) => u.displayName.toLowerCase() === trimmed.toLowerCase());
  if (byName.length === 1) {
    return byName[0].slackUserId;
  }

  return normalize(trimmed);
};

function SuggestionList({
  users,
  query,
  visible,
  onPick,
}: {
  users: UserOption[];
  query: string;
  visible: boolean;
  onPick: (user: UserOption) => void;
}) {
  if (!visible || !query.trim()) {
    return null;
  }

  const q = query.trim().toLowerCase();
  const filtered = users
    .filter((u) => u.slackUserId.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q))
    .slice(0, 8);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
      {filtered.map((user) => (
        <button
          key={user.slackUserId}
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
          onMouseDown={(e) => {
            // Keep input focused so blur handlers don't run before click.
            e.preventDefault();
          }}
          onClick={() => onPick(user)}
        >
          <span className="truncate">{user.displayName}</span>
          <span className="ml-3 shrink-0 text-xs text-slate-500">{user.slackUserId}</span>
        </button>
      ))}
    </div>
  );
}

export function UserIdInput({
  name,
  label,
  placeholder,
  users,
  required = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  users: UserOption[];
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputId = useId();

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.slackUserId.toUpperCase(), u.displayName])),
    [users],
  );
  const matchedName = userMap.get(value.trim().toUpperCase());

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <div className="relative">
        <Input
          id={inputId}
          name={name}
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggestions(true);
          }}
        />
        <SuggestionList
          users={users}
          query={value}
          visible={showSuggestions}
          onPick={(user) => {
            setValue(user.slackUserId);
            setShowSuggestions(false);
          }}
        />
      </div>
      {value.trim() ? (
        <p className="text-xs text-slate-500">
          {matchedName ? `Matched user: ${matchedName} (${value.trim().toUpperCase()})` : "No exact user match yet."}
        </p>
      ) : null}
    </label>
  );
}

export function BulkUserIdChipInput({
  name,
  label,
  users,
  required = false,
}: {
  name: string;
  label: string;
  users: UserOption[];
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const userMap = useMemo(() => new Map(users.map((u) => [u.slackUserId, u.displayName])), [users]);

  const addToken = (token: string) => {
    const resolved = resolveSlackUserIdToken(token, users);
    if (!resolved) {
      return;
    }
    setChips((prev) => (prev.includes(resolved) ? prev : [...prev, resolved]));
  };

  const addFromQuery = () => {
    const tokens = query
      .split(/[\n,]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    tokens.forEach(addToken);
    setQuery("");
  };

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input type="hidden" name={name} value={chips.join(",")} required={required} />
      <div className="rounded-md border border-slate-300 p-2">
        {chips.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Badge key={chip} className="gap-2">
                <span>
                  {userMap.get(chip) ?? "Unknown"} · {chip}
                </span>
                <button
                  type="button"
                  className="text-slate-500 hover:text-slate-900"
                  onClick={() => setChips((prev) => prev.filter((item) => item !== chip))}
                  aria-label={`Remove ${chip}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="relative">
          <Input
            type="text"
            value={query}
            autoComplete="off"
            placeholder="Type a name or Slack ID, then press Enter"
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addFromQuery();
                setShowSuggestions(false);
              }
            }}
            onBlur={() => {
              if (query.trim()) {
                addFromQuery();
              }
              setShowSuggestions(false);
            }}
          />
          <SuggestionList
            users={users}
            query={query}
            visible={showSuggestions}
            onPick={(user) => {
              addToken(user.slackUserId);
              setQuery("");
              setShowSuggestions(false);
            }}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">Press Enter/comma to add each user. Chips are submitted as Slack IDs.</p>
    </label>
  );
}
