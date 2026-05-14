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

/* ===============================
   DATA RANGE (LABEL + VALUE)
================================ */
const ranges = [
  { label: "5 Menit Terakhir", value: "last_5m" },
  { label: "15 Menit Terakhir", value: "last_15m" },
  { label: "1 Jam Terakhir", value: "last_1h" },
  { label: "6 Jam Terakhir", value: "last_6h" },
  { label: "24 Jam Terakhir", value: "last_24h" },
  { label: "7 Hari Terakhir", value: "last_7d" },
  { label: "30 Hari Terakhir", value: "last_30d" },
  { label: "Hari Ini", value: "today" },
  { label: "Kemarin", value: "yesterday" },
  { label: "Minggu Ini", value: "this_week" },
  { label: "Bulan Ini", value: "this_month" },
  { label: "Kuartal Ini", value: "this_quarter" },
  { label: "Semester Ini", value: "this_half" },
  { label: "Tahun Ini", value: "this_year" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function RangeGrafik({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selected = ranges.find((r) => r.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          {selected?.label ?? "Pilih Rentang"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[240px] p-0 rounded-xl shadow-lg"
      >
        <Command>
          <CommandInput 
          placeholder="Cari rentang..."
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
            {ranges.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === item.value
                      ? "opacity-100"
                      : "opacity-0"
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