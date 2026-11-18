import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { TransactionTable } from '../TransactionTable';
import { Pagination } from '@/components/ui/Pagination';
import { TransactionRecordDto } from '@/types';

const mockTransactions: TransactionRecordDto[] = [
  {
    id: 'TXN-001',
    username: 'azra',
    amount: -250,
    created_at: '2026-11-18T08:30:00Z',
    description: 'Payment for services',
  },
  {
    id: 'TXN-002',
    username: 'raka',
    amount: 1500,
    created_at: '2026-11-17T12:00:00Z',
    description: 'Incoming reward',
  },
];

describe('Transactions Table & Pagination', () => {
  it('renders table headers and row items with appropriate direction badges and amounts', () => {
    renderWithProviders(
      <TransactionTable items={mockTransactions} isLoading={false} />
    );

    // Headers
    expect(screen.getByText('Transaction ID')).toBeInTheDocument();
    expect(screen.getByText('Counterparty')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();

    // Rows
    expect(screen.getByText('TXN-001')).toBeInTheDocument();
    expect(screen.getByText('@azra')).toBeInTheDocument();
    expect(screen.getByText('Outgoing')).toBeInTheDocument();
    expect(screen.getByText('-250 units')).toBeInTheDocument();

    expect(screen.getByText('TXN-002')).toBeInTheDocument();
    expect(screen.getByText('@raka')).toBeInTheDocument();
    expect(screen.getByText('Incoming')).toBeInTheDocument();
    expect(screen.getByText('+1,500 units')).toBeInTheDocument();
  });

  it('handles pagination navigation and page-size changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    renderWithProviders(
      <Pagination
        currentPage={1}
        totalItems={45}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next page/i });
    await user.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    expect(prevBtn).toBeDisabled();

    // Change page size
    const select = screen.getByLabelText(/per page/i);
    await user.selectOptions(select, '25');
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
