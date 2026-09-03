import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Load test environment variables
process.env.MOCK_AI = 'true';
process.env.JWT_SECRET = 'test-secret';

// General Next.js mocks for Unit/Integration tests
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
