import { describe, test, expect } from '@jest/globals';
import { splitHands } from '../src/parser/handReader';

describe('splitHands', () => {
  test('découpe correctement les mains séparées par double saut de ligne', () => {
    const content = `
Winamax Poker - Hand #123456789 - Hold'em NL
Seat 1: Alice (1000)
Seat 2: Bob (1000)
Alice posts small blind 5
Bob posts big blind 10

Winamax Poker - Hand #123456790 - Hold\'em NL
Seat 1: Alice (995)
Seat 2: Bob (990)
Alice posts small blind 5
Bob posts big blind 10
`;

    const hands = splitHands(content);

    expect(hands.length).toBe(2);
    expect(hands[0]).toContain('Hand #123456789');
    expect(hands[1]).toContain('Hand #123456790');
  });
});
