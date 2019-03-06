export class SyntaxUtils {
    static snakeCaseToCamelCase(str: string): string {
        return str.replace(/_\w/, (m) => m[1].toUpperCase());
    }
}