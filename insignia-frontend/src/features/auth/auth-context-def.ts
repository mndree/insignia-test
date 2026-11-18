import { createContext } from 'react';
import { AuthUser, LoginDto, RegisterUserDto } from '@/types';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  registerWallet: (data: RegisterUserDto) => Promise<string>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
