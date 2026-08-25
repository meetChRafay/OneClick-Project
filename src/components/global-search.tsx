"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, CheckSquare, Sparkles, FileText, AlertTriangle, Users } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearchAction } from "@/lib/actions/search";

type SearchResults = Awaited<ReturnType<typeof globalSearchAction>>;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (e.key === "/" && (e.target as HTMLElement)?.tagName === "INPUT") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearchAction(query);
        setResults(r);
      });
    }, 150);
    return () => clearTimeout(handle);
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const results2 = query.trim() ? results : null;
  const hasResults =
    results2 &&
    (results2.projects.length ||
      results2.tasks.length ||
      results2.topics.length ||
      results2.files.length ||
      results2.issues.length ||
      results2.clients.length);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground w-full max-w-xs hover:border-ring/50 transition-colors cursor-pointer"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search everything…</span>
        <span className="sm:hidden">Search</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search across your workspace">
        <CommandInput placeholder="Search projects, tasks, files, issues, clients…" value={query} onValueChange={setQuery} />
        <CommandList>
          {!query.trim() && <CommandEmpty>Type to search across your entire workspace.</CommandEmpty>}
          {query.trim() && !hasResults && <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>}
          {results2?.projects && results2.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {results2.projects.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/projects/${p.id}`)}>
                  <FolderKanban /> {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results2?.tasks && results2.tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {results2.tasks.map((t) => (
                <CommandItem key={t.id} onSelect={() => go(`/tasks/${t.id}`)}>
                  <CheckSquare /> {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results2?.topics && results2.topics.length > 0 && (
            <CommandGroup heading="Topics">
              {results2.topics.map((t) => (
                <CommandItem key={t.id} onSelect={() => go(`/topics`)}>
                  <Sparkles /> {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results2?.files && results2.files.length > 0 && (
            <CommandGroup heading="Files">
              {results2.files.map((f) => (
                <CommandItem key={f.id} onSelect={() => go(`/files`)}>
                  <FileText /> {f.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results2?.issues && results2.issues.length > 0 && (
            <CommandGroup heading="Issues">
              {results2.issues.map((i) => (
                <CommandItem key={i.id} onSelect={() => go(`/issues/${i.id}`)}>
                  <AlertTriangle /> {i.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results2?.clients && results2.clients.length > 0 && (
            <CommandGroup heading="Clients">
              {results2.clients.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/clients/${c.id}`)}>
                  <Users /> {c.company_name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
