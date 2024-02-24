import React from 'react';

export const Home: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div>{children}This is home</div>;
};
