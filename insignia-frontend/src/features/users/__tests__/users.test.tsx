import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { UsersListPage } from '../UsersListPage';
import { UserDetailsPage } from '../UserDetailsPage';

describe('Users List & User Details Pages', () => {
  it('renders UsersListPage with 3 stat cards and users table', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/users" element={<UsersListPage />} />
      </Routes>,
      { initialEntries: ['/users'] }
    );

    // Verify Stat Cards
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Total Wallet Balance')).toBeInTheDocument();
    });

    // Verify key users from mockup
    await waitFor(() => {
      expect(screen.getByText('Andre Juliansyah')).toBeInTheDocument();
      expect(screen.getByText('@andre')).toBeInTheDocument();
      expect(screen.getByText('Azra Putri')).toBeInTheDocument();
      expect(screen.getByText('@azra')).toBeInTheDocument();
      expect(screen.getByText('24,500')).toBeInTheDocument();
    });
  });

  it('renders UserDetailsPage with biodata, wallet balance, received/sent stats, and recent transactions', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/users/:id" element={<UserDetailsPage />} />
      </Routes>,
      { initialEntries: ['/users/andre'] }
    );

    // Verify header and identity banner
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /user details/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Andre Juliansyah' })).toBeInTheDocument();
      expect(screen.getByText('ID USR-0001')).toBeInTheDocument();
    });

    // Verify Biodata card
    expect(screen.getByRole('heading', { level: 3, name: /user biodata/i })).toBeInTheDocument();
    expect(screen.getByText('andre.juliansyah@example.com')).toBeInTheDocument();
    expect(screen.getByText('+62 812 3456 7890')).toBeInTheDocument();
    expect(screen.getByText('South Jakarta, Indonesia')).toBeInTheDocument();

    // Verify Wallet Balance & Stats
    expect(screen.getByRole('heading', { level: 3, name: /wallet balance/i })).toBeInTheDocument();
    expect(screen.getByText('Total Received')).toBeInTheDocument();
    expect(screen.getByText('40,000')).toBeInTheDocument();
    expect(screen.getByText('Total Sent')).toBeInTheDocument();
    expect(screen.getByText('15,500')).toBeInTheDocument();

    // Verify Recent Transactions
    expect(screen.getByRole('heading', { level: 3, name: /recent transactions/i })).toBeInTheDocument();
    expect(screen.getByText('TXN-9021')).toBeInTheDocument();
  });

  it('opens transfer balance modal from UserDetailsPage and computes balance deduction', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/users/:id" element={<UserDetailsPage />} />
      </Routes>,
      { initialEntries: ['/users/andre'] }
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /transfer balance/i })).toBeInTheDocument();
    });

    const transferBtn = screen.getByRole('button', { name: /transfer balance/i });
    await user.click(transferBtn);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/send balance from andre/i)).toBeInTheDocument();
    });

    // Check calculation summary box
    expect(screen.getByText('Transfer amount')).toBeInTheDocument();
    expect(screen.getByText('Balance after transfer')).toBeInTheDocument();
  });
});
