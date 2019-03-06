export class SyntaxUtils {
    static snakeCaseToCamelCase(str: string): string {
        return str.replace(/_\w/gi, (m) => m[1].toUpperCase());
    }
}