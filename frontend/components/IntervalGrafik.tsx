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
  "10 seconds",
  "30 seconds",
  "1 minute",
  "5 minutes",
  "10 minutes",
  "15 minutes",
  "30 minutes",
  "1 hour",
  "6 hours",
  "12 hours",
  "1 day",
  "1 week",
  "1 month",
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function IntervalGrafik({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

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
            {intervals.map((item) => (
              <CommandItem
                key={item}
                value={item}
                onSelect={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === item ? "opacity-100" : "opacity-0"
                  }`}
                />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}