import { evaluateHandStrength } from '../src/utils/handStrength';

describe('evaluateHandStrength', () => {
  test('high card', () => {
    const hand = ['As', 'Kc'];
    const board = ['7d', '9s', '2c'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('high card');
    expect(result.score).toBe(0);
  });

  test('pair', () => {
    const hand = ['As', 'Ad'];
    const board = ['7d', '9s', '2c'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('pair');
    expect(result.score).toBeGreaterThanOrEqual(0.45);
  });

  test('two pair', () => {
    const hand = ['As', 'Ad'];
    const board = ['7d', '7s', '2c'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('two pair');
    expect(result.score).toBeGreaterThanOrEqual(0.6);
  });

  test('three of a kind', () => {
    const hand = ['As', 'Ac'];
    const board = ['7d', '9s', 'Ad'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('three of a kind');
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  test('straight', () => {
    const hand = ['6s', '5c'];
    const board = ['7d', '8s', '9c'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('straight');
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  test('flush', () => {
    const hand = ['As', '2s'];
    const board = ['7s', '9s', 'Ks'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('flush');
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  test('full house', () => {
    const hand = ['As', 'Ac'];
    const board = ['7d', '7s', 'Ad'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('full house');
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  test('four of a kind', () => {
    const hand = ['As', 'Ac'];
    const board = ['Ad', 'Ah', '7c'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('four of a kind');
    expect(result.score).toBeGreaterThanOrEqual(0.95);
  });

  test('straight flush', () => {
    const hand = ['6s', '5s'];
    const board = ['7s', '8s', '9s'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('straight flush');
    expect(result.score).toBeGreaterThanOrEqual(0.98);
  });

  test('royal flush', () => {
    const hand = ['As', 'Ks'];
    const board = ['Qs', 'Js', '10s'];
    const result = evaluateHandStrength([...hand, ...board]);
    expect(result.label).toBe('royal flush');
    expect(result.score).toBe(1);
  });
});

