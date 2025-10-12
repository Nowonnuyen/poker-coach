import { potOdds } from '../src/utils/poker';

describe('potOdds', () => {
  test('calcule les pot odds correctement', () => {
    expect(potOdds(50, 150)).toBeCloseTo(0.25);
    expect(potOdds(30, 70)).toBeCloseTo(0.3);
  });

  test('lance une erreur si les valeurs sont négatives ou nulles', () => {
    expect(() => potOdds(-10, 100)).toThrow();
    expect(() => potOdds(10, -100)).toThrow();
    expect(() => potOdds(0, 50)).toThrow();
  });
});

