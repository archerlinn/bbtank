import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BBTank title', () => {
  render(<App />);
  const titleElement = screen.getByText(/BBTank/i);
  expect(titleElement).toBeInTheDocument();
});
