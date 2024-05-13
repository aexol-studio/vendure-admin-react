import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

export enum FilterFieldType {
  IDOperators = 'IDOperators',
  DateOperators = 'DateOperators',
  NumberOperators = 'NumberOperators',
  StringOperators = 'StringOperators',
  BooleanOperators = 'BooleanOperators',
}

type Option = { name: string; key: string; type: FilterFieldType };

type Props = {
  selectOptions: Option[];
  selectedOptionKey?: string;
  onSelectValueChange: (newKey: string) => void;
  onNoneSelect: () => void;
  selectPlaceholder?: string;
  optionValue?: string;
  setOptionValue: (newValue?: string) => void;
};
export const FieldFilter: React.FC<Props> = ({
  selectOptions,
  selectedOptionKey,
  onNoneSelect,
  onSelectValueChange,
  selectPlaceholder,
  optionValue,
  setOptionValue,
}) => {
  const { t } = useTranslation('common');
  const currentFieldValueType = useMemo(
    () => selectOptions.find((i) => i.key === selectedOptionKey),
    [selectedOptionKey, selectOptions],
  );

  const [optionValueString] = useState(optionValue || '');
  const [debouncedOptionStringValue] = useDebounce(optionValueString, 500);

  useEffect(() => {
    if (
      currentFieldValueType &&
      (currentFieldValueType.type === FilterFieldType.IDOperators ||
        currentFieldValueType.type === FilterFieldType.StringOperators)
    ) {
      if (optionValue !== debouncedOptionStringValue) {
        if (debouncedOptionStringValue === '') {
          setOptionValue(undefined);
        } else {
          setOptionValue(debouncedOptionStringValue);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOptionStringValue, currentFieldValueType]);

  return (
    <>
      <Select
        value={selectedOptionKey}
        onValueChange={(e) => {
          e === 'none' ? onNoneSelect() : onSelectValueChange(e);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t(`noFilterField`)}</SelectItem>
          {selectOptions.map((i) => (
            <SelectItem key={i.key} value={i.key}>
              {i.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentFieldValueType &&
        (currentFieldValueType.type === FilterFieldType.IDOperators ||
        currentFieldValueType.type === FilterFieldType.StringOperators ? (
          <Input
            disabled={!optionValue}
            placeholder="Filter codes..."
            value={optionValue}
            onChange={(event) => setOptionValue(event.target.value)}
            className="max-w-sm"
          />
        ) : currentFieldValueType.type === FilterFieldType.NumberOperators ? (
          <></>
        ) : null)}
    </>
  );
};
