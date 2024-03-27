import React from 'react';
import { Input } from './input';
import { useSearchParams } from 'react-router-dom';
import { Stack } from './Stack';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
import { Checkbox } from './checkbox';
import { AccordionItem, Accordion, AccordionContent, AccordionTrigger } from './accordion';
import {} from '@radix-ui/react-accordion';
import { Label } from './label';
import { Button } from './button';
export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (!e.currentTarget.value?.length) {
      searchParams.delete(key);
      setSearchParams(searchParams);
      return;
    }
    searchParams.set(key, e.currentTarget.value);
    setSearchParams(searchParams);
  };
  const handleCheckboxChange = (key: string) => {
    if (searchParams.get('facetIdOpt') === key) {
      searchParams.delete('facetIdOpt');
      setSearchParams(searchParams);
      return;
    }
    searchParams.set('facetIdOpt', key);
    setSearchParams(searchParams);
  };

  return (
    <Stack className="gap-4 justify-end">
      <Input placeholder="Search..." onChange={(e) => handleInputChange(e, 'q')} />
      <Sheet>
        <SheetTrigger>
          <Button>Advanced Search</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Advanced products search</SheetTitle>

            <Accordion type="multiple">
              <AccordionItem value="item-1">
                <AccordionTrigger className="hover:no-underline">By facet id</AccordionTrigger>
                <AccordionContent>
                  <div className="pb-6">
                    <Input
                      className="space-y-8"
                      placeholder="Search..."
                      onChange={(e) => handleInputChange(e, 'facetId')}
                    />
                  </div>
                  <div className="grid grid-cols-2  mb-4 sm:flex-row gap-4 ">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        onCheckedChange={() => handleCheckboxChange('eq')}
                        checked={searchParams.get('facetIdOpt') === 'eq'}
                        id="eq"
                      />
                      <Label htmlFor="eq">Equal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notEq"
                        onCheckedChange={() => handleCheckboxChange('notEq')}
                        checked={searchParams.get('facetIdOpt') === 'notEq'}
                      />
                      <Label htmlFor="notEq">Not equal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in"
                        onCheckedChange={() => handleCheckboxChange('in')}
                        checked={searchParams.get('facetIdOpt') === 'in'}
                      />
                      <Label htmlFor="in">In</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notIn"
                        onCheckedChange={() => handleCheckboxChange('notIn')}
                        checked={searchParams.get('facetIdOpt') === 'notIn'}
                      />
                      <Label htmlFor="notIn">Not In</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </Stack>
  );
};
