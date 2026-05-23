"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const intervals = [
  { label: "1 minute", minutes: 1 },
  { label: "5 minutes", minutes: 5 },
  { label: "10 minutes", minutes: 10 },
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "6 hours", minutes: 360 },
  { label: "12 hours", minutes: 720 },
  { label: "1 day", minutes: 1440 },
  { label: "1 week", minutes: 10080 },
  { label: "1 month", minutes: 43200 },
];

const rangeToMinutes: Record<string, number> = {
  last_5m: 5,
  last_15m: 15,
  last_1h: 60,
  last_6h: 360,
  last_24h: 1440,
  last_7d: 10080,
  last_30d: 43200,
  today: 1440,
  yesterday: 1440,
  this_week: 10080,
  this_month: 43200,
  this_quarter: 129600,
  this_half: 259200,
  this_year: 525600,
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  rangeId?: string;
};

export default function IntervalGrafik({ value, onChange, rangeId = "last_24h" }: Props) {
  const [open, setOpen] = useState(false);

  const rangeMins = rangeToMinutes[rangeId] || 1440;
  const validIntervals = intervals.filter(i => i.minutes <= rangeMins);

  // Auto-correct if selected value is larger than allowed
  const currentIntervalObj = intervals.find(i => i.label === value);
  if (currentIntervalObj && currentIntervalObj.minutes > rangeMins) {
      // Find the closest valid interval
      const fallback = validIntervals.length > 0 ? validIntervals[validIntervals.length - 1].label : "1 minute";
      setTimeout(() => onChange(fallback), 0);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ✅ FIX UTAMA */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          {value}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[240px] p-0 rounded-xl shadow-lg"
      >
        <Command>
          <CommandInput 
          placeholder="Cari interval..."
          className="
              h-5
              px-2
              text-sm
              [&_svg]:w-4
              [&_svg]:h-5
              [&_svg]:mr-2
            " 
          />
          <CommandEmpty>Tidak ditemukan</CommandEmpty>

          <CommandGroup className="max-h-[250px] overflow-y-auto">
            {validIntervals.map((item) => (
              <CommandItem
                key={item.label}
                value={item.label}
                onSelect={() => {
                  onChange(item.label);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === item.label ? "opacity-100" : "opacity-0"
                  }`}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}