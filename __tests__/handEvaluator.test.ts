// __tests__/handEvaluator.test.ts
import { evaluateHand } from '../src/utils/handEvaluator';

describe('evaluateHand', () => {
  test('retourne "High Card" pour une main vide ou sans combinaison', () => {
    expect(evaluateHand(['2H', '5D', '9C', 'KS', '7H'])).toBe('High Card');
  });

  test('lance une erreur si la main est vide', () => {
    expect(() => evaluateHand([])).toThrow('La main ne peut pas être vide');
  });
});
