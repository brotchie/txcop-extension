import { BackgroundProxy, PreflightAction} from '../messaging';
import { EthereumMonkeypatcher } from './monkeypatch';

const proxy = new BackgroundProxy();
const patcher = new EthereumMonkeypatcher();

(async function() {
    const result = await patcher.monkeypatch();
    if (!result) {
        throw new Error("Failed to monkeypatch");
    }

    patcher.setRequestHandler(async (args) => {
        const result = await proxy.preflightMethodCall(args);
        return result.action === PreflightAction.PASSTHROUGH;
    });
})();