import { ContentScriptBackgroundRelay } from '../messaging';

const relay = new ContentScriptBackgroundRelay();

function injectInpageScript() {
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement('script');
  scriptTag.setAttribute('async', 'false');
  scriptTag.src = chrome.runtime.getURL('inpage.js');
  container.insertBefore(scriptTag, container.children[0]);
  container.removeChild(scriptTag);
}

injectInpageScript();
