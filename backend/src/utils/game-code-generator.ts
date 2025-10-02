import { nanoid, customAlphabet } from 'nanoid';

export class GameCodeGenerator {
  private static readonly CODE_LENGTH = 8;
  private static readonly ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly customNanoid = customAlphabet(this.ALPHABET, this.CODE_LENGTH);

  static generate(): string {
    return this.customNanoid();
  }

  static generateCustom(length: number): string {
    const customGen = customAlphabet(this.ALPHABET, length);
    return customGen();
  }

  static isValidFormat(code: string): boolean {
    const pattern = /^[A-Z0-9]{8}$/;
    return pattern.test(code);
  }
}

export default GameCodeGenerator;
