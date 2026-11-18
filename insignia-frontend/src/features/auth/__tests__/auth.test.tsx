import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { LoginPage } from '../LoginPage';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../useAuth';
import { Button } from '@/components/ui/Button';

// Test consumer component to check auth state & trigger logout
const TestAuthConsumer = () => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
      <span data-testid="username">{user?.username}</span>
      <Button onClick={logout}>Log Out</Button>
    </div>
  );
};

describe('Authentication & Session Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders login page with username and password fields', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { initialEntries: ['/login'] }
    );

    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('authenticates successfully with valid demo credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<TestAuthConsumer />} />
      </Routes>,
      { initialEntries: ['/login'] }
    );

    const usernameInput = screen.getByLabelText(/^username$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.clear(usernameInput);
    await user.type(usernameInput, 'admin');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'admin123');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('admin');
    });
  });

  it('shows accessible error message on invalid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { initialEntries: ['/login'] }
    );

    const usernameInput = screen.getByLabelText(/^username$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.clear(usernameInput);
    await user.type(usernameInput, 'wrong_user');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'wrong_password');
    await user.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain('Invalid credentials');
    });
  });

  it('redirects unauthenticated users attempting to access protected route', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Secret Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page Target</div>} />
      </Routes>,
      { initialEntries: ['/'] }
    );

    // Protected content should not render, redirected to login
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
  });

  it('clears session and cached data on logout', async () => {
    const user = userEvent.setup();
    // Seed authenticated session in storage
    sessionStorage.setItem(
      'insignia_auth_session',
      JSON.stringify({ username: 'admin', token: 'mock-token-admin-987654321' })
    );

    renderWithProviders(
      <Routes>
        <Route path="/" element={<TestAuthConsumer />} />
      </Routes>,
      { initialEntries: ['/'] }
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    const logoutBtn = screen.getByRole('button', { name: /log out/i });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      expect(sessionStorage.getItem('insignia_auth_session')).toBeNull();
    });
  });
});
