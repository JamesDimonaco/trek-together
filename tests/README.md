# Simple Testing 🧪

Keep it simple. Test what matters.

## Run Tests
```bash
pnpm test
```

## Add Tests
Create `*.test.ts` files in `tests/` folder.

## Example
```typescript
import { myFunction } from '@/lib/myFunction'

describe('My feature', () => {
  it('should work', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

That's it. Simple and effective.