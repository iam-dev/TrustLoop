import { create } from 'zustand';

interface AuthState {
  isConnected: boolean;
  address: string | undefined;
  connect: (address: string) => void;
  disconnect: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isConnected: false,
  address: undefined,
  connect: (address: string) => set({ isConnected: true, address }),
  disconnect: () => set({ isConnected: false, address: undefined }),
}));

export default useAuthStore;