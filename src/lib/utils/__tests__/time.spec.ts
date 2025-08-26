import { describe, it, expect } from 'vitest';
import { calcDurationMin, overlaps } from '../time';

describe('calcDurationMin', () => {
  it('berechnet Minuten korrekt', () => {
    const start = '2025-01-15T08:00:00.000Z';
    const end   = '2025-01-15T09:30:00.000Z';
    expect(calcDurationMin(start, end)).toBe(90);
  });

  it('wirft bei Ende <= Start', () => {
    const start = '2025-01-15T08:00:00.000Z';
    const end   = '2025-01-15T08:00:00.000Z';
    expect(() => calcDurationMin(start, end)).toThrow();
  });
});

describe('overlaps', () => {
  it('erkennt Überschneidung', () => {
    const aS = new Date('2025-01-15T08:00:00Z');
    const aE = new Date('2025-01-15T10:00:00Z');
    const bS = new Date('2025-01-15T09:00:00Z');
    const bE = new Date('2025-01-15T11:00:00Z');
    expect(overlaps(aS, aE, bS, bE)).toBe(true);
  });

  it('kein Overlap bei direkt aneinander', () => {
    const aS = new Date('2025-01-15T08:00:00Z');
    const aE = new Date('2025-01-15T10:00:00Z');
    const bS = new Date('2025-01-15T10:00:00Z');
    const bE = new Date('2025-01-15T12:00:00Z');
    expect(overlaps(aS, aE, bS, bE)).toBe(false);
  });
});
