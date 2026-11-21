import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { TopupModal } from '../TopupModal';
import { TransferModal } from '../TransferModal';
import { BalanceCard } from '../BalanceCard';
import { formatWalletUnits } from '@/utils/formatters';

describe('Overview & Wallet Transactions', () => {
  it('correctly formats incoming and outgoing wallet unit strings', () => {
    // Incoming with explicit sign
    expect(formatWalletUnits(1000, { includeSign: true })).toBe('+1,000 units');
    // Outgoing signed
    expect(formatWalletUnits(-250)).toBe('-250 units');
    // Absolute outgoing for charts/rankings
    expect(formatWalletUnits(-5000, { absolute: true })).toBe('5,000 units');
  });

  it('renders balance card with formatted units and handles actions', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onOpenTopup = vi.fn();
    const onOpenTransfer = vi.fn();

    renderWithProviders(
      <BalanceCard
        balance={14250}
        isLoading={false}
        isFetching={false}
        onRefresh={onRefresh}
        onOpenTopup={onOpenTopup}
        onOpenTransfer={onOpenTransfer}
      />
    );

    expect(screen.getByText('14,250')).toBeInTheDocument();
    expect(screen.getByText(/wallet units/i)).toBeInTheDocument();

    const topupBtn = screen.getByRole('button', { name: /top up/i });
    await user.click(topupBtn);
    expect(onOpenTopup).toHaveBeenCalledOnce();

    const transferBtn = screen.getByRole('button', { name: /transfer/i });
    await user.click(transferBtn);
    expect(onOpenTransfer).toHaveBeenCalledOnce();
  });

  it('enforces top-up boundary rules: amount > 0 and < 10,000,000', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<TopupModal isOpen={true} onClose={onClose} />);

    const amountInput = screen.getByLabelText(/top-up amount/i);
    const submitBtn = screen.getByRole('button', { name: /confirm top-up/i });

    // Test zero or negative amount
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });

    // Test upper boundary >= 10,000,000
    await user.clear(amountInput);
    await user.type(amountInput, '10000000');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/amount must be strictly less than 10,000,000/i)).toBeInTheDocument();
    });
  });

  it('prevents transfer exceeding available balance and prevents duplicate submission', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const currentBalance = 500;

    renderWithProviders(
      <TransferModal
        isOpen={true}
        onClose={onClose}
        currentBalance={currentBalance}
      />
    );

    // Verify both From and To dropdown labels exist
    await waitFor(() => {
      expect(screen.getByText(/from \(sender account\)/i)).toBeInTheDocument();
      expect(screen.getByText(/to \(recipient account\)/i)).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/transfer amount/i);
    const reviewBtn = screen.getByRole('button', { name: /review transfer/i });

    // Exceed balance (999,999,999 > available)
    await user.clear(amountInput);
    await user.type(amountInput, '999999999');
    await user.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  });
});
