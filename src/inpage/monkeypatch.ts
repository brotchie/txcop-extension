interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

type Ethereum = {
    request: (args: RequestArguments) => Promise<unknown>,
};

const POLLING_INTERVAL = 100;
const POLLING_TIMEOUT = 5000;

/** Monkey patches the ethereum provider so we can intercept method calls. */
export class EthereumMonkeypatcher {
    private monkeypatched_: boolean = false;
    private requestHandler_?: (args: RequestArguments) => Promise<boolean>;

    setRequestHandler(handler: (args: RequestArguments) => Promise<boolean>): void {
        this.requestHandler_ = handler;
    }

    monkeypatch(): Promise<boolean> {
        // Already monkey patched, do nothing.
        if (this.monkeypatched_) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            // If window.etheruem already exists, then we can
            // patch it immediately.
            if (this.tryMonkeypatch_()) {
                resolve(true);
            } else {
                // Otherwise, we look for window.etheruem every polling
                // interval, keeping track if we're been looking for
                // timeout, and if so returning false.
                let totalTime = 0;
                const interval = setInterval(() => {
                    if(this.tryMonkeypatch_()) {
                        clearInterval(interval);
                        resolve(true);
                    } else {
                        totalTime += POLLING_INTERVAL;
                        if (totalTime >= POLLING_TIMEOUT) {
                            clearInterval(interval);
                            resolve(false);
                        }
                    }
                }, POLLING_INTERVAL);
            }
        });
    }

    private tryMonkeypatch_(): boolean {
        if (!this.doesEthereumObjectExist_()) {
            return false;
        }
        this.monkeypatchEthereumObject_();
        return true;
    }

    private monkeypatchEthereumObject_(): void {
        const ethereum = this.getEthereumObject_();

        const originalRequest = ethereum.request;
        ethereum.request = async (args) => {
            if (this.requestHandler_) {
                const result = await this.requestHandler_(args);
                if (result === true) {
                    return await originalRequest(args);
                } else {
                    throw new Error("Blocked");
                }
            } else {
                return await originalRequest(args);
            }
        };

        this.monkeypatched_ = true;
    }

    private doesEthereumObjectExist_(): boolean {
        return this.getEthereumObject_() !== undefined;
    }

    private getEthereumObject_(): Ethereum | undefined {
        return (window as any).ethereum as Ethereum | undefined;
    }
}