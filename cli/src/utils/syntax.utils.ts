export const indentation = '  ';
export class SyntaxUtils {
    static snakeCaseToCamelCase(str: string): string {
        return str.replace(/_\w/gi, (m) => m[1].toUpperCase());
    }

    static capitalize(str: string) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }

    static camelCaseToTitleCase(str: string) {
        return str
            .replace(/^[a-z]/g, (l) => l.toUpperCase())
            .replace(/[A-Z]/g, (l) => ` ${l.toUpperCase()}`);
    }

    static simplifyDbFileForAnalysis(fileString: string): string {
        let toReturn = fileString;
        toReturn = toReturn
            .replace(/--.*?$/gm, '')
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\n/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/ {2}/g, ' ')
            .replace(/ {2}/g, ' ') // we do this one twice to manage the odd number of spaces
            .replace(/\\"/g, '');
        return toReturn;
    }
}