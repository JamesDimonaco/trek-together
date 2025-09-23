import { render, screen } from '@testing-library/react'

// Simple component test
function TestComponent() {
  return <div>Hello TrekTogether</div>
}

describe('Component basics', () => {
  it('should render components', () => {
    render(<TestComponent />)
    expect(screen.getByText('Hello TrekTogether')).toBeInTheDocument()
  })
})