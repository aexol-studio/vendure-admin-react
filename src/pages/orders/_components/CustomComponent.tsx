import { DefaultProps } from '../DefaultInputs/types';

export const CustomComponent = (props: DefaultProps<boolean>) => {
  const { value, onChange } = props;
  return (
    <div>
      <input type="checkbox" checked={value} onChange={() => onChange(!value)} />
      <label>Super testowy component</label>
    </div>
  );
};
