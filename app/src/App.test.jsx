import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

describe('App', () => {
  it('exports a React component', () => {
    expect(App).toBeTypeOf('function');
  });

  it('renders the application shell', () => {
    const markup = renderToString(<App />);

    expect(markup).toContain('Travgen frontier office');
    expect(markup).toContain('Character Generator');
  });
});
