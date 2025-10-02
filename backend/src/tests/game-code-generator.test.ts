import { describe, it, expect } from 'vitest';
import { GameCodeGenerator } from '../utils/game-code-generator.js';

describe('GameCodeGenerator', () => {
  describe('generate', () => {
    it('should generate a code of correct length', () => {
      const code = GameCodeGenerator.generate();
      expect(code).toHaveLength(8);
    });

    it('should generate uppercase codes', () => {
      const code = GameCodeGenerator.generate();
      expect(code).toBe(code.toUpperCase());
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = GameCodeGenerator.generate();
      const code2 = GameCodeGenerator.generate();
      expect(code1).not.toBe(code2);
    });
  });

  describe('generateCustom', () => {
    it('should generate a code with custom alphabet', () => {
      const code = GameCodeGenerator.generateCustom();
      expect(code).toHaveLength(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = GameCodeGenerator.generateCustom();
      const code2 = GameCodeGenerator.generateCustom();
      expect(code1).not.toBe(code2);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid format', () => {
      const validCodes = ['ABCD1234', '12345678', 'AAAAAAAA', '00000000'];
      
      validCodes.forEach(code => {
        expect(GameCodeGenerator.isValidFormat(code)).toBe(true);
      });
    });

    it('should return false for invalid format', () => {
      const invalidCodes = [
        'abcd1234', // lowercase
        'ABCD123',  // too short
        'ABCD12345', // too long
        'ABCD-123', // invalid character
        'ABCD 123', // space
        '',         // empty
        'abcd!@#$'  // special characters
      ];
      
      invalidCodes.forEach(code => {
        expect(GameCodeGenerator.isValidFormat(code)).toBe(false);
      });
    });
  });
});
