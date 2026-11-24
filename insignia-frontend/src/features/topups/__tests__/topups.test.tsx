import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { TopupTable } from '../TopupTable';
import { TopupDetailsModal } from '../TopupDetailsModal';
import { TopupRecordDto } from '@/types';

const mockTopups: TopupRecordDto[] = [
  {
    id: 'topup-001',
    topupCode: 'TOP-0001',
    userId: 'user-001',
    user: {
      id: 'user-001',
      userCode: 'USR-0001',
      username: 'andre',
      fullName: 'Andre Juliansyah',
      email: 'andre@example.com',
      phone: '+62 812 3456 7890',
      avatarUrl: null,
    },
    amount: 25000,
    notes: 'Initial balance funding',
    attachment: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    createdBy: 'admin',
    createdAt: '2026-11-20T10:00:00Z',
  },
  {
    id: 'topup-002',
    topupCode: 'TOP-0002',
    userId: 'user-002',
    user: {
      id: 'user-002',
      userCode: 'USR-0002',
      username: 'azra',
      fullName: 'Azra Putri',
      email: 'azra@example.com',
      avatarUrl: null,
    },
    amount: 15000,
    notes: 'Bonus deposit',
    attachment: null,
    createdBy: 'admin',
    createdAt: '2026-11-21T11:00:00Z',
  },
];

describe('Topups Grid List & Detail Modal', () => {
  it('renders topups grid list table with column headers, formatted units, and action buttons', () => {
    const onViewDetail = vi.fn();

    renderWithProviders(
      <TopupTable
        items={mockTopups}
        isLoading={false}
        totalCount={2}
        onViewDetail={onViewDetail}
      />
    );

    // Headers
    expect(screen.getByText('Topup ID')).toBeInTheDocument();
    expect(screen.getByText('Recipient User')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Created By')).toBeInTheDocument();
    expect(screen.getByText('Receipt')).toBeInTheDocument();
    expect(screen.getByText('Date & Time')).toBeInTheDocument();

    // Row 1
    expect(screen.getByText('TOP-0001')).toBeInTheDocument();
    expect(screen.getByText('Andre Juliansyah')).toBeInTheDocument();
    expect(screen.getByText('@andre')).toBeInTheDocument();
    expect(screen.getByText('+25,000')).toBeInTheDocument();
    expect(screen.getByText('Attached')).toBeInTheDocument();

    // Row 2
    expect(screen.getByText('TOP-0002')).toBeInTheDocument();
    expect(screen.getByText('Azra Putri')).toBeInTheDocument();
    expect(screen.getByText('@azra')).toBeInTheDocument();
    expect(screen.getByText('+15,000')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();

    // Detail buttons
    const detailButtons = screen.getAllByRole('button', { name: /detail/i });
    expect(detailButtons.length).toBe(2);
  });

  it('triggers onViewDetail callback when clicking Detail button', async () => {
    const user = userEvent.setup();
    const onViewDetail = vi.fn();

    renderWithProviders(
      <TopupTable
        items={mockTopups}
        isLoading={false}
        totalCount={2}
        onViewDetail={onViewDetail}
      />
    );

    const detailButtons = screen.getAllByRole('button', { name: /detail/i });
    await user.click(detailButtons[0]);

    expect(onViewDetail).toHaveBeenCalledWith(mockTopups[0]);
  });

  it('renders TopupDetailsModal with full transaction metadata and attachment preview', () => {
    const onClose = vi.fn();

    renderWithProviders(
      <TopupDetailsModal
        isOpen={true}
        onClose={onClose}
        topup={mockTopups[0]}
      />
    );

    expect(screen.getByText('Top-up Transaction Details')).toBeInTheDocument();
    expect(screen.getByText('+25,000')).toBeInTheDocument();
    expect(screen.getByText('Recipient User')).toBeInTheDocument();
    expect(screen.getByText('Andre Juliansyah')).toBeInTheDocument();
    expect(screen.getByText('@andre')).toBeInTheDocument();
    expect(screen.getByText('Initial balance funding')).toBeInTheDocument();
    expect(screen.getByText(/proof of payment \/ receipt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });
});
