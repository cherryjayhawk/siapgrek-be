"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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

const parameters = [
  "Env temp",
  "Env hum",
  "Soil temp",
  "Soil hum",
  "Soil pH",
  "Soil conductivity",
  "Light",
];

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

export default function ParameterGrafik({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  function toggle(param: string) {
    if (value.includes(param)) {
      onChange(value.filter((v) => v !== param));
    } else {
      onChange([...value, param]);
    }
  }

  function remove(param: string) {
    onChange(value.filter((v) => v !== param));
  }

  return (
    <div className="w-[240px]">
      <Popover open={open} onOpenChange={setOpen}>
        {/* ✅ FIX UTAMA */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Pilih Parameter
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[260px] p-0 rounded-xl shadow-lg"
        >
          <Command>
            <CommandInput 
              placeholder="Cari Parameter..."
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
              {parameters.map((param) => (
                <CommandItem
                  key={param}
                  value={param}
                  onSelect={() => toggle(param)}
                  className="cursor-pointer"
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value.includes(param)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  {param}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* TAG */}
      <div className="flex flex-wrap gap-2 mt-3">
        {value.map((param) => (
          <div
            key={param}
            className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs"
          >
            {param}
            <X
              size={12}
              className="cursor-pointer opacity-60 hover:opacity-100"
              onClick={() => remove(param)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}