import * as fs from 'fs';
import * as path from 'path';
import { LoggerUtils } from './logger.utils';

export class FileUtils {
    static getFileList(params: {
        startPath: string,
        foldersToIgnore?: string[],
        filter: RegExp;
    }): Promise<any> {
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
            let files = fileNames.filter((x: string) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                return !stat.isDirectory() && params.filter.test(fileName);
            });
            if (directories.length > 0) {
                return Promise.all(directories.map((x: string) => {
                    return FileUtils.getFileList({ startPath: params.startPath + '/' + x, filter: params.filter, foldersToIgnore: foldersToIgnore })
                })).then((fileLists: any) => {
                    let fileList = fileLists.reduce((current: string[], item: string[]) => {
                        current = current.concat(item);
                        return current;
                    }, []);
                    fileList = fileList.concat(files.map((x: string) => params.startPath + '/' + x));
                    return new Promise((resolve) => {
                        resolve(fileList);
                    });
                });
            }
            else {
                return new Promise((resolve) => {
                    resolve(files.map((x: string) => params.startPath + '/' + x));
                });
            }
        }
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

    static readFile(fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    console.log(error);
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
        LoggerUtils.info({origin: 'FileUtils', message: `Creating ${fileName}`});
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
        const splitPath = path.replace('//','/').split('/');
        if (depth === splitPath.length - 1) {
            return;
        } else {
            FileUtils.createFolderIfNotExistsSync(splitPath.splice(0,depth + 1).join('/'));
            FileUtils.createFolderStructureIfNeeded(path, depth + 1);
        }
    }

    static renameFolder(from: string, to: string): Promise<any> {
        return new Promise((resolve, reject) => {
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
        console.log('Deleting ' + fileName);
        
        fs.unlinkSync(fileName);
    }

    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path: string, sub: boolean = false) {
        if (!sub) {
            LoggerUtils.info({origin: 'FileUtils', message: `Deleting ${path}`});
        }
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
}