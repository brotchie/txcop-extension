// TODO(brotchie): This is hardcoded to support a single Request <> Response
//                 for method calls. This interface could be made generic
//                 to support arbitrary message payloads.

// TODO(brotchie): This is using Chrome specific methods. If we need to support
//                 browsers beyond chrome, we may need to use an extension
//                 abstraction layer.

/** A method call from Javascript to wallet provider. */
export type WalletMethodCall = {
  method: string;
  params: any[];
};

/** The action taken as a result of preflight checking a method call. */
export enum PreflightAction {
  /** Passthrough the method call to the underlying wallet provider. */
  PASSTHROUGH,
  /** Block the method call from reaching the underlying wallet provider. */
  BLOCK,
}

/** Result of preflight checking a method call. */
export type PreflightResult = {
  action: PreflightAction;
};


/* Internal types for messaging between inpage <> contentscript <> background. */
type Topics = 'txcop';
type Endpoints = 'txcop-inpage' | 'txcop-background';

type PreflightMethodCallRequest = {
  id: number;
  call: WalletMethodCall;
  topic: Topics;
  sender: Endpoints;
  recipient: Endpoints;
};

type PreflightMethodCallResponse = {
  id: number;
  result: PreflightResult;
  topic: Topics;
  sender: Endpoints;
  recipient: Endpoints;
};

/** Exposes a promise-based interface to the background service worker. */
export class BackgroundProxy {
  private currentId: number = 0;
  private pending: {
    resolve: (resolve: PreflightResult) => void;
    reject: (err: any) => void;
  }[] = [];

  constructor() {
    window.addEventListener('message', this.onMessage_.bind(this));
  }

  preflightMethodCall(call: WalletMethodCall): Promise<PreflightResult> {
    const id = this.currentId;
    this.currentId += 1;
    window.postMessage({
      id,
      call,
      topic: 'txcop',
      sender: 'txcop-inpage',
      recipient: 'txcop-background',
    } as PreflightMethodCallRequest);
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
      message.sender === 'txcop-background' &&
      message.recipient === 'txcop-inpage';
    if (!shouldProcess) {
      return;
    }

    if (this.pending[message.id] && this.pending[message.id].resolve) {
      this.pending[message.id].resolve(message.result);
    }

    // Cleanup promises.
    delete this.pending[message.id];
  }
}

/** Background service worker listener. */
export class InpageListener {
  private handler_: (call: WalletMethodCall) => Promise<PreflightResult>;

  constructor() {
    chrome.runtime.onMessage.addListener(
      this.onMessageFromContentScript_.bind(this)
    );
  }

  setPreflightResultHandler(
    handler: (call: WalletMethodCall) => Promise<PreflightResult>
  ): void {
    this.handler_ = handler;
  }

  private onMessageFromContentScript_(
    event: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    const message = event as PreflightMethodCallRequest;

    const shouldProcess =
      message.topic === 'txcop' &&
      message.sender === 'txcop-inpage' &&
      message.recipient === 'txcop-background';
    if (!shouldProcess) {
      return false;
    }

    this.handler_(message.call).then((result: PreflightResult) =>
      sendResponse({
        id: message.id,
        result,
        topic: 'txcop',
        sender: 'txcop-background',
        recipient: 'txcop-inpage',
      } as PreflightMethodCallResponse)
    );
    return true;
  }
}

/** Relays messages between the inpage script and the background service worker. */
export class ContentScriptBackgroundRelay {
  constructor() {
    window.addEventListener('message', this.onMessageFromInpage_.bind(this));
  }

  private onMessageFromInpage_(event: MessageEvent): void {
    const message = event.data as PreflightMethodCallRequest;
    if (message.recipient !== 'txcop-background') {
      return;
    }
    chrome.runtime.sendMessage(
      message,
      (response: PreflightMethodCallResponse) => {
        window.postMessage(response);
      }
    );
  }
}