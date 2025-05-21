'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@workspace/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';

interface ComboboxItem {
  label: string;
  value: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Select an option...',
  isLoading = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedItem = items.find(item => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." disabled={isLoading} />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={currentValue => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
