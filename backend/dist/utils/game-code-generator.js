import { customAlphabet } from 'nanoid';
export class GameCodeGenerator {
    static CODE_LENGTH = 8;
    static ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    static customNanoid = customAlphabet(this.ALPHABET, this.CODE_LENGTH);
    static generate() {
        return this.customNanoid();
    }
    static generateCustom(length) {
        const customGen = customAlphabet(this.ALPHABET, length);
        return customGen();
    }
    static isValidFormat(code) {
        const pattern = /^[A-Z0-9]{8}$/;
        return pattern.test(code);
    }
}
export default GameCodeGenerator;
//# sourceMappingURL=game-code-generator.js.map