import * as fs from 'fs';
import * as path from 'path';
import { LoggerUtils } from './logger.utils';
import { exec } from 'child_process';

export interface FileAndContent {
    path: string;
    fileContent: string;
}

export class FileUtils {
    static async getFileList(params: {
        startPath: string;
        foldersToIgnore?: string[];
        maxLevels?: number;
        currentLevel?: number;
        filter: RegExp;
    }): Promise<string[]> {
        params.startPath = FileUtils.replaceSlashes(params.startPath);
        params.currentLevel = (params.currentLevel || 0) + 1;
        const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
        if (foldersToIgnore) {
            if (foldersToIgnore.indexOf('node_modules') === -1) {
                foldersToIgnore.push('node_modules');
            }
        }

        if (!fs.existsSync(params.startPath)) {
            console.error(params.startPath + ' does not exist');
            return Promise.resolve([]);
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            let directories = fileNames.filter((x: string) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    return foldersToIgnore.filter(y => fileName.indexOf(y) === 0).length === 0
                }
                return false;
            });
            let files = fileNames.filter((x: string) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                return !stat.isDirectory() && params.filter.test(fileName);
            });
            if (directories.length > 0 && (!params.maxLevels || params.maxLevels >= params.currentLevel)) {
                const fileLists: string[][] = await Promise.all(directories.map((x: string) => {
                    return FileUtils.getFileList({
                        ...params,
                        startPath: params.startPath + '/' + x,
                        foldersToIgnore: foldersToIgnore
                    });
                }));
                let fileList: string[] = fileLists.reduce((current: string[], item: string[]) => current.concat(item), []);
                const newFileList: string[] = fileList.concat(files.map((x: string) => params.startPath + '/' + x));
                return newFileList;
            }
            else {
                return files.map((x: string) => params.startPath + '/' + x);
            }
        }
    }

    static deleteEmptyFolders(params: {
        startPath: string;
        maxLevels?: number;
        currentLevel?: number;
    }): boolean {
        params.startPath = FileUtils.replaceSlashes(params.startPath);
        params.currentLevel = (params.currentLevel || 0) + 1;

        if (!fs.existsSync(params.startPath)) {
            console.error(params.startPath + ' does not exist');
            return false;
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            const { directories, hasFiles } = fileNames.reduce((agg: { directories: string[], hasFiles: boolean }, x: string) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    agg.directories.push(x);
                } else {
                    agg.hasFiles = true;
                }
                return agg;
            }, { directories: [], hasFiles: false });

            if (directories.length > 0 && (!params.maxLevels || params.maxLevels >= params.currentLevel)) {
                const canDeleteSubs: boolean[] = directories.map((x: string) => FileUtils.deleteEmptyFolders({
                    ...params,
                    startPath: params.startPath + '/' + x
                }));
                if (!hasFiles && canDeleteSubs.filter(x => !x).length === 0) {
                    FileUtils.deleteFolderRecursiveSync(params.startPath);
                    return true;
                }
                return false;
            } else if (hasFiles) {
                return false;
            } else {
                FileUtils.deleteFolderRecursiveSync(params.startPath);
                return true;
            }
        }
    }

    static replaceSlashes(path: string) {
        return path
            .replace(/\/\//g, '/')
            .replace(/\\\\/g, '/')
            .replace(/\\/g, '/');
    }

    static getFolderList(params: {
        startPath: string,
        foldersToIgnore?: string[]
    }): Promise<string[]> {
        const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
        if (foldersToIgnore) {
            if (foldersToIgnore.indexOf('node_modules') === -1) {
                foldersToIgnore.push('node_modules');
            }
        }

        if (!fs.existsSync(params.startPath)) {
            console.log(params.startPath + ' does not exist');
            return Promise.resolve([]);
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            let directories = fileNames.filter((x: string) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    return foldersToIgnore.filter(y => fileName.indexOf(y) > -1).length === 0
                }
                return false;
            });
            return Promise.resolve(directories.map(x => params.startPath + '/' + x));
        }
    }

    static async readFile(fileName: string): Promise<string> {
        return await new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data.toString('ascii'));
                }
            });
        });
    }

    static readFileSync(fileName: string): string {
        return fs.readFileSync(fileName).toString('ascii');
    }

    static writeFileSync(fileName: string, content: string) {
        // LoggerUtils.info({origin: 'FileUtils', message: `Creating ${fileName}`});
        FileUtils.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }

    static readJsonFile(fileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    try {
                        resolve(JSON.parse(data.toString('ascii')));
                    } catch (error) {
                        console.log(fileName);
                        reject(error);
                    }
                }
            });
        });
    }

    static createFolderIfNotExistsSync(folderName: string) {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }

    static checkIfFolderExists(folderName: string) {
        return fs.existsSync(folderName);
    }

    static createFolderStructureIfNeeded(path: string, depth: number = 0): void {
        const splitPath = path
            .replace(/\\/g, '/')
            .replace(/\/\//g, '/')
            .split('/');
        if (depth === splitPath.length - 1) {
            return;
        } else {
            FileUtils.createFolderIfNotExistsSync(splitPath.splice(0, depth + 1).join('/'));
            FileUtils.createFolderStructureIfNeeded(path, depth + 1);
        }
    }

    static async renameFolder(from: string, to: string): Promise<void> {
        return await new Promise((resolve, reject) => {
            fs.rename(from, to, (error) => {
                if (error) {
                    console.log(error);

                    reject(error);
                } else {
                    resolve();
                }
            })
        })
    }

    static copyFileSync(from: string, to: string) {
        const source = FileUtils.readFileSync(from);
        FileUtils.writeFileSync(to, source);
    }

    static deleteFileSync(fileName: string) {
        fs.unlinkSync(fileName);
    }

    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path: string, sub: boolean = false) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    FileUtils.deleteFolderRecursiveSync(curPath, true);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

    static async openFileInFileEditor(fileName: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            try {
                const cp = exec(`"${fileName}"`, (error, stdout, stderr) => {
                    if (error) {
                        reject(`exec error: ${error}`);
                        return;
                    }
                    cp.kill();
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static async openFolderInExplorer(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            try {
                const cp = exec(`start .`, (error) => {
                    if (error) {
                        reject(`exec error: ${error}`);
                        return;
                    }
                    cp.kill();
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
