# TypeScript Language Profile

## Detection

```bash
# Primary indicators
ls package.json tsconfig.json 2>/dev/null
grep -l "typescript" package.json 2>/dev/null
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Files (types) | camelCase or PascalCase | `user.types.ts` or `User.ts` |
| Variables | camelCase | `userName` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Enums | PascalCase | `UserRole` |
| Functions | camelCase | `getUserById` |
| React Components | PascalCase | `UserCard` |

## Directory Structure Patterns

### Next.js App Router
```
src/
├── app/
│   ├── api/
│   │   └── [resource]/
│   │       └── route.ts
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/           # Reusable UI primitives
│   └── features/     # Feature-specific components
├── lib/              # Utilities and helpers
├── types/            # Type definitions
└── hooks/            # Custom React hooks
```

### Express/Node.js
```
src/
├── routes/
├── controllers/
├── services/
├── models/
├── middleware/
├── types/
└── utils/
```

## Import Patterns

```typescript
// Preferred order:
// 1. Node/external modules
import { z } from 'zod';

// 2. Internal aliases (@/)
import { Button } from '@/components/ui/button';

// 3. Relative imports
import { formatDate } from '../utils/date';

// 4. Types (with type keyword)
import type { User } from '@/types';
```

## Type Definition Patterns

```typescript
// Prefer interfaces for objects that might be extended
interface User {
  id: string;
  email: string;
}

// Use type for unions, intersections, primitives
type UserRole = 'admin' | 'user' | 'guest';
type UserWithRole = User & { role: UserRole };

// Zod for runtime validation
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});
type User = z.infer<typeof userSchema>;
```

## Test Patterns

### Jest/Vitest
```typescript
// test file: *.test.ts or *.spec.ts
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const user = await createUser({ email: 'test@test.com' });
    expect(user.id).toBeDefined();
  });
});
```

### React Testing Library
```typescript
import { render, screen } from '@testing-library/react';

test('renders user name', () => {
  render(<UserCard user={mockUser} />);
  expect(screen.getByText(mockUser.name)).toBeInTheDocument();
});
```

## Framework-Specific

### React/Next.js
- Use functional components with hooks
- Prefer Server Components where possible (Next.js 13+)
- Use `'use client'` directive only when needed
- Avoid barrel exports in large codebases

### Express
- Use async/await with try-catch
- Middleware pattern for cross-cutting concerns
- Repository pattern for data access
- DTO pattern for request/response typing

## Common Pitfalls

1. **Any escape hatch**: Avoid `any`, use `unknown` and narrow
2. **Missing null checks**: Use optional chaining `?.` and nullish coalescing `??`
3. **Implicit any in callbacks**: Always type callback parameters
4. **Enum vs Union**: Prefer string unions over numeric enums
5. **Type assertions**: Avoid `as`, use type guards instead

## Build/Run Commands

```bash
# Development
npm run dev          # Next.js, Vite
npx ts-node src/index.ts  # Node.js scripts

# Build
npm run build
npx tsc              # TypeScript compilation

# Test
npm test
npm run test:watch
npm run test:coverage

# Lint
npm run lint
npx eslint . --fix
```
