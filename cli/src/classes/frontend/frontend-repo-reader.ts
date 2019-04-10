import { UiUtils } from '../../utils/ui.utils';

export class FrontendRepositoryReader {
    private static _origin = 'FrontendRepositoryReader';

    static async readRepo(startPath: string, repoName: string, uiUtils: UiUtils, silent?: boolean) {
        // todo
        uiUtils.success({ origin: FrontendRepositoryReader._origin, message: `Repository read` });
    }

}