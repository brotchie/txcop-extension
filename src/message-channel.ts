type Topics = 'txcop';
type Endpoints = 'txcop-content-script' | 'txcop-inpage';

type MethodCall = {
  method: string;
  params: any[];
};

enum PreflightAction {
  PASSTHROUGH,
  BLOCK,
}

type PreflightResult = {
  action: PreflightAction;
};

type PreflightResultHandler = (call: MethodCall) => Promise<PreflightResult>;

type PreflightMethodCallRequest = {
  id: number;
  call: MethodCall;
  topic: 'txcop';
  sender: 'txcop-content-script' | 'txcop-inpage';
  recipient: 'txcop-content-script' | 'txcop-inpage';
};

type PreflightMethodCallResponse = {
  id: number;
  result: PreflightResult;
  topic: 'txcop';
  sender: 'txcop-content-script' | 'txcop-inpage';
  recipient: 'txcop-content-script' | 'txcop-inpage';
};

class InpageToContentScriptProxy {
  private currentId: number = 0;
  private pending: {
    resolve: (resolve: PreflightResult) => void;
    reject: (err: any) => void;
  }[] = [];

  constructor() {
    window.addEventListener('message', this.onMessage_.bind(this));
  }

  preflightMethodCall(call: MethodCall): Promise<PreflightResult> {
    const id = this.currentId;
    this.currentId += 1;
    window.postMessage({
      id,
      call,
      topic: 'txcop',
      sender: 'txcop-inpage',
      recipient: 'txcop-content-script',
    });
    // TODO: Add a timeout here so it rejects after x seconds.
    return new Promise((resolve, reject) => {
      this.pending[id] = { resolve, reject };
    });
  }

  private onMessage_(event: MessageEvent) {
    const message = event.data as PreflightMethodCallResponse;

    // Only process contentscript -> inpage messages.
    const shouldProcess =
      message.topic === 'txcop' &&
      message.sender === 'txcop-content-script' &&
      message.recipient === 'txcop-inpage';
    if (!shouldProcess) {
      return;
    }

    this.pending[message.id].resolve(message.result);

    // Cleanup promises.
    delete this.pending[message.id];
  }
}

class ContentScriptInpageListener {
  private handler_: PreflightResultHandler;

  constructor() {
    window.addEventListener('message', this.onMessage_.bind(this));
  }

  setPreflightMethodCallHandler(handler: PreflightResultHandler) {
    this.handler_ = handler;
  }

  private onMessage_(event: MessageEvent) {
    const message = event.data as PreflightMethodCallRequest;

    // Only process inpage -> contentscript messages.
    const shouldProcess =
      message.topic === 'txcop' &&
      message.sender === 'txcop-inpage' &&
      message.recipient === 'txcop-content-script';
    if (!shouldProcess) {
      return;
    }

    this.handler_(message.call).then((result) => {
      window.postMessage({
        id: message.id,
        result,
        topic: 'txcop',
        sender: 'txcop-content-script',
        recipient: 'txcop-inpage',
      });
    });
  }
}
