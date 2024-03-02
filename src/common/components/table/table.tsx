import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';

export const TableRow = styled(Stack)`
  padding: 0.5rem 1rem;
  background-color: ${(p) => p.theme.neutrals.L7};
  color: ${(p) => p.theme.text.active};
  border-bottom: 1px solid ${(p) => p.theme.neutrals.L5};
`;
export const TableAvatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: ${(p) => p.theme.border.primary.radius};
  object-fit: cover;
`;
export const TH = ({ children, ...props }: Parameters<typeof Typography>[0]) => (
  <Typography variant="Body 2 SB" {...props}>
    {children}
  </Typography>
);
