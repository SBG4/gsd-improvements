# Property-Based Testing Verification

## Overview

Property-based testing generates test cases from acceptance criteria, providing higher confidence than pattern-matching verification. Instead of checking "does file exist?", we check "does the system behave correctly?"

## Acceptance Criteria Format

### In PLAN.md

```yaml
must_haves:
  truths:
    - "User can create account with valid email/password"
    - "Invalid email formats are rejected"
    - "Passwords must be 8+ characters"
    - "Duplicate emails are rejected"
```

### Parseable Format

For automated test generation, use structured criteria:

```yaml
acceptance_criteria:
  - id: AC-001
    truth: "User can create account with valid email/password"
    input:
      email: "valid email format"
      password: "string, min 8 chars"
    output: "user object with id"
    status: 201

  - id: AC-002
    truth: "Invalid email formats are rejected"
    input:
      email: "invalid email format"
      password: "valid password"
    output: "error message"
    status: 400

  - id: AC-003
    truth: "Passwords must be 8+ characters"
    input:
      email: "valid email"
      password: "string, < 8 chars"
    output: "validation error"
    status: 400
```

## Test Generation

### From Acceptance Criteria to Property Tests

```typescript
// Generated from AC-001, AC-002, AC-003
import * as fc from 'fast-check';
import { createUser, isValidEmail } from '../src/services/user';

describe('User Creation Properties', () => {
  // AC-001: Valid inputs succeed
  test.prop([
    fc.emailAddress(),
    fc.string({ minLength: 8, maxLength: 100 })
  ])('valid email and password creates user', async (email, password) => {
    const result = await createUser({ email, password });
    expect(result.id).toBeDefined();
    expect(result.email).toBe(email.toLowerCase());
  });

  // AC-002: Invalid emails rejected
  test.prop([
    fc.string().filter(s => !isValidEmail(s)),
    fc.string({ minLength: 8 })
  ])('invalid email is rejected', async (email, password) => {
    await expect(createUser({ email, password }))
      .rejects.toThrow(/invalid email/i);
  });

  // AC-003: Short passwords rejected
  test.prop([
    fc.emailAddress(),
    fc.string({ maxLength: 7 })
  ])('password under 8 chars is rejected', async (email, password) => {
    await expect(createUser({ email, password }))
      .rejects.toThrow(/password.*8/i);
  });
});
```

### Generator Mapping

| Input Type | fast-check Generator |
|------------|---------------------|
| email | `fc.emailAddress()` |
| string | `fc.string()` |
| string (min/max) | `fc.string({ minLength, maxLength })` |
| integer | `fc.integer()` |
| integer (range) | `fc.integer({ min, max })` |
| uuid | `fc.uuid()` |
| date | `fc.date()` |
| boolean | `fc.boolean()` |
| array | `fc.array(generator)` |
| object | `fc.record({ ... })` |

## Integration with Verifier

### Enhanced Verification Flow

```
Standard Verification:
1. Check artifact exists
2. Check artifact has content
3. Check key links wired

Property Verification (NEW):
4. Generate property tests from acceptance_criteria
5. Run property tests
6. Report results
```

### In gsd-verifier Agent

```markdown
<step name="property_verification">
If acceptance_criteria present in PLAN.md:

1. Generate property test file:
   `.planning/phases/XX-name/XX-NN-PROPERTIES.test.ts`

2. Run property tests:
   ```bash
   npx jest XX-NN-PROPERTIES.test.ts --testTimeout=30000
   ```

3. Parse results:
   - All pass: ✓ Properties verified
   - Any fail: ✗ Property violation found

4. Include in VERIFICATION.md:
   ```markdown
   ## Property Verification

   | Property | Result | Iterations |
   |----------|--------|------------|
   | valid email creates user | ✓ | 100 |
   | invalid email rejected | ✓ | 100 |
   | short password rejected | ✓ | 100 |
   ```
</step>
```

## Configuration

### In .planning/config.json

```json
{
  "verification": {
    "property_testing": true,
    "iterations": 100,
    "timeout_ms": 30000,
    "frameworks": {
      "typescript": "fast-check",
      "python": "hypothesis",
      "go": "gopter"
    }
  }
}
```

### Framework-Specific Generators

**Python (Hypothesis):**
```python
from hypothesis import given
from hypothesis import strategies as st

@given(
    email=st.emails(),
    password=st.text(min_size=8, max_size=100)
)
def test_valid_user_creation(email, password):
    user = create_user(email=email, password=password)
    assert user.id is not None
```

**Go (gopter):**
```go
func TestUserCreation(t *testing.T) {
    properties := gopter.NewProperties(nil)

    properties.Property("valid input creates user", prop.ForAll(
        func(email string, password string) bool {
            user, err := CreateUser(email, password)
            return err == nil && user.ID != ""
        },
        gen.Email(),
        gen.AlphaString().WithMinLen(8),
    ))

    properties.TestingRun(t)
}
```

## Benefits Over Pattern Matching

| Aspect | Pattern Matching | Property Testing |
|--------|------------------|------------------|
| Confidence | Low (file exists) | High (behavior correct) |
| Edge Cases | Manual | Automatic |
| Regression | Partial | Complete |
| False Positives | Common (stubs) | Rare |
| Maintenance | None | Some |

## When to Use

**Use Property Testing:**
- Business logic with defined inputs/outputs
- Validation rules
- Data transformations
- API contracts

**Skip Property Testing:**
- UI components (use visual testing)
- Configuration changes
- Simple CRUD with no logic
