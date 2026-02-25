# Testing Patterns

## Unit Test Structure

Use `describe` blocks grouped by function, with `it` blocks per case:

```typescript
describe('functionName', () => {
  it('should handle normal input', () => {
    // Arrange → Act → Assert
  });

  it('should throw on invalid input', () => {
    expect(() => fn(null)).toThrow();
  });
});
```

## Mock Patterns

- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` for method spies
- Always restore mocks in `afterEach`
