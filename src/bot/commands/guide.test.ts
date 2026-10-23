/**
 * Test for guide command logic
 */

import { describe, it, expect } from 'vitest';
import { guideCommand } from './guide';

describe('guide command', () => {
  it('has correct name and description', () => {
    const json = guideCommand.toJSON();
    expect(json.name).toBe('guide');
    expect(json.description).toContain('guide');
  });
});
