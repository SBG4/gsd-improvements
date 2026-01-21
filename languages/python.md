# Python Language Profile

## Detection

```bash
# Primary indicators
ls requirements.txt pyproject.toml setup.py Pipfile 2>/dev/null
ls *.py 2>/dev/null | head -1
```

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files | snake_case | `user_service.py` |
| Variables | snake_case | `user_name` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Classes | PascalCase | `UserProfile` |
| Functions | snake_case | `get_user_by_id` |
| Methods | snake_case | `calculate_total` |
| Private | _leading_underscore | `_internal_helper` |
| Modules | snake_case | `data_processing` |

## Directory Structure Patterns

### FastAPI/Modern Python
```
src/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── endpoints/
│   │       └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── models/           # SQLAlchemy/Pydantic
│   ├── schemas/          # Pydantic schemas
│   ├── services/
│   └── db/
├── tests/
├── alembic/              # Migrations
├── requirements.txt
└── pyproject.toml
```

### Django
```
project/
├── manage.py
├── project/
│   ├── settings.py
│   └── urls.py
├── apps/
│   └── users/
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       └── tests.py
└── requirements.txt
```

## Import Patterns

```python
# Standard library
import os
from datetime import datetime
from typing import Optional, List

# Third-party
from fastapi import FastAPI, Depends
from pydantic import BaseModel
import sqlalchemy as sa

# Local application
from app.core.config import settings
from app.models.user import User
from . import schemas
```

## Type Hinting Patterns

```python
from typing import Optional, List, Dict, Union
from pydantic import BaseModel, Field

# Function signatures
def get_user(user_id: int) -> Optional[User]:
    ...

async def list_users(skip: int = 0, limit: int = 100) -> List[User]:
    ...

# Pydantic models
class UserCreate(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True  # Pydantic v2
```

## Test Patterns

### pytest
```python
# test file: test_*.py or *_test.py
import pytest
from app.services.user import create_user

@pytest.fixture
def db_session():
    # Setup
    yield session
    # Teardown

def test_create_user(db_session):
    user = create_user(db_session, email="test@test.com")
    assert user.id is not None

@pytest.mark.asyncio
async def test_async_operation():
    result = await async_function()
    assert result == expected
```

### pytest-asyncio for FastAPI
```python
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_read_users(client: AsyncClient):
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
```

## Framework-Specific

### FastAPI
- Use dependency injection with `Depends()`
- Pydantic for request/response validation
- async/await for I/O operations
- Background tasks for long operations

### Django
- Use class-based views for CRUD
- Django REST Framework for APIs
- Signals for side effects
- Custom managers for complex queries

### SQLAlchemy 2.0
```python
from sqlalchemy import select
from sqlalchemy.orm import Session

# Modern style (2.0)
stmt = select(User).where(User.id == user_id)
result = session.execute(stmt)
user = result.scalar_one_or_none()
```

## Common Pitfalls

1. **Mutable default arguments**: Never use `def foo(items=[]):`
2. **Missing __init__.py**: Required for package recognition
3. **Circular imports**: Use import inside function or TYPE_CHECKING
4. **Not using context managers**: Always `with open()` for files
5. **Ignoring type hints**: Use `mypy` for static type checking

## Build/Run Commands

```bash
# Virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
pip install -e .  # Editable install

# Run
python -m app.main
uvicorn app.main:app --reload  # FastAPI
python manage.py runserver     # Django

# Test
pytest
pytest -v --cov=app
pytest -k "test_user"

# Lint
ruff check .
ruff format .
mypy app/
```
