export declare class AuthUtils {
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateToken(payload: object): string;
    static verifyToken(token: string): any;
    static extractTokenFromHeader(authHeader: string | undefined): string | null;
}
export default AuthUtils;
//# sourceMappingURL=auth.d.ts.map