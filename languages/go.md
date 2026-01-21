# Go Language Profile

## Detection

```bash
# Primary indicators
ls go.mod go.sum 2>/dev/null
ls *.go 2>/dev/null | head -1
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files | snake_case | `user_handler.go` |
| Packages | lowercase, short | `user`, `auth` |
| Variables | camelCase | `userName` |
| Exported | PascalCase | `GetUser` |
| Unexported | camelCase | `getUserInternal` |
| Constants | PascalCase or camelCase | `MaxRetries` |
| Interfaces | PascalCase + -er suffix | `Reader`, `UserService` |
| Structs | PascalCase | `UserProfile` |
| Acronyms | All caps | `HTTPHandler`, `UserID` |

## Directory Structure Patterns

### Standard Layout
```
project/
├── cmd/
│   └── api/
│       └── main.go       # Entry point
├── internal/
│   ├── handlers/         # HTTP handlers
│   ├── services/         # Business logic
│   ├── repository/       # Data access
│   ├── models/           # Domain models
│   └── middleware/
├── pkg/                  # Public libraries
├── api/                  # OpenAPI specs, protos
├── configs/
├── migrations/
├── go.mod
└── go.sum
```

### Simple Service
```
project/
├── main.go
├── handlers.go
├── models.go
├── repository.go
├── go.mod
└── go.sum
```

## Import Patterns

```go
import (
    // Standard library
    "context"
    "encoding/json"
    "net/http"

    // Third-party
    "github.com/go-chi/chi/v5"
    "github.com/jackc/pgx/v5"

    // Internal
    "myproject/internal/models"
    "myproject/internal/services"
)
```

## Type Definition Patterns

```go
// Domain model
type User struct {
    ID        string    `json:"id" db:"id"`
    Email     string    `json:"email" db:"email"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Request/Response DTOs
type CreateUserRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

type CreateUserResponse struct {
    User  *User  `json:"user"`
    Token string `json:"token"`
}

// Interface for dependency injection
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id string) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
}
```

## Error Handling Patterns

```go
// Custom error types
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with ID %s not found", e.Resource, e.ID)
}

// Error wrapping
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}

// Check error type
if errors.Is(err, sql.ErrNoRows) {
    return nil, &NotFoundError{Resource: "user", ID: id}
}
```

## Test Patterns

```go
// test file: *_test.go
package user_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestCreateUser(t *testing.T) {
    // Arrange
    repo := NewMockRepository()
    service := NewUserService(repo)

    // Act
    user, err := service.Create(ctx, &CreateUserRequest{
        Email: "test@test.com",
    })

    // Assert
    require.NoError(t, err)
    assert.NotEmpty(t, user.ID)
}

// Table-driven tests
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        {"valid email", "test@test.com", false},
        {"invalid email", "notanemail", true},
        {"empty email", "", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Framework-Specific

### chi (HTTP Router)
```go
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Route("/api/v1", func(r chi.Router) {
    r.Route("/users", func(r chi.Router) {
        r.Get("/", h.ListUsers)
        r.Post("/", h.CreateUser)
        r.Get("/{id}", h.GetUser)
    })
})
```

### GORM
```go
type User struct {
    gorm.Model
    Email string `gorm:"uniqueIndex"`
}

// Queries
var user User
db.First(&user, "email = ?", email)
db.Create(&user)
```

### sqlx
```go
var user User
err := db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", id)
```

## Common Pitfalls

1. **Nil pointer dereference**: Always check for nil before using pointers
2. **Goroutine leaks**: Always ensure goroutines can exit
3. **Race conditions**: Use mutex or channels for shared state
4. **Ignoring errors**: Never use `_` for errors in production
5. **Context propagation**: Always pass context through call chain

## Build/Run Commands

```bash
# Run
go run ./cmd/api
go run main.go

# Build
go build -o bin/api ./cmd/api
CGO_ENABLED=0 go build -o bin/api ./cmd/api  # Static binary

# Test
go test ./...
go test -v ./...
go test -cover ./...
go test -race ./...  # Race detector

# Lint
golangci-lint run
go vet ./...

# Dependencies
go mod tidy
go mod download
go get -u ./...
```
