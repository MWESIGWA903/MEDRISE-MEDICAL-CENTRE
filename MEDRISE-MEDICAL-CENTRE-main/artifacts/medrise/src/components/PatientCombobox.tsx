import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface PatientOption {
  id: number;
  fullName: string;
  phone: string;
  age?: number | null;
  ageMonths?: number | null;
  ageDays?: number | null;
  gender?: string | null;
}

interface PatientComboboxProps {
  patients: PatientOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function formatPatientAge(p: PatientOption): string {
  const parts: string[] = [];
  if (p.age) parts.push(`${p.age}y`);
  if (p.ageMonths) parts.push(`${p.ageMonths}m`);
  if (p.ageDays) parts.push(`${p.ageDays}d`);
  return parts.length ? ` · ${parts.join(" ")}` : "";
}

export function PatientCombobox({
  patients,
  value,
  onValueChange,
  placeholder = "Search by name, phone or ID…",
  className,
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = patients.find(p => String(p.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-10 text-sm", className)}
        >
          <span className="truncate">
            {selected ? (
              `${selected.fullName} — ${selected.phone}${formatPatientAge(selected)}`
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[440px] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            const p = patients.find(p => String(p.id) === itemValue);
            if (!p) return 0;
            const q = search.toLowerCase();
            if (p.fullName.toLowerCase().includes(q)) return 1;
            if (p.phone.toLowerCase().includes(q)) return 1;
            if (String(p.id).includes(q)) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Type name, phone or patient ID…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup heading={`${patients.length} registered patients`}>
              {patients.map(p => (
                <CommandItem
                  key={p.id}
                  value={String(p.id)}
                  onSelect={current => {
                    onValueChange(current === value ? "" : current);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === String(p.id) ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.phone}{formatPatientAge(p)}{p.gender ? ` · ${p.gender}` : ""} · ID #{p.id}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
