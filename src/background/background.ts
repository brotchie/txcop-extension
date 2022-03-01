import { NotificationManager } from '../notification-manager';

import {
  InpageListener,
  WalletMethodCall,
  PreflightAction,
} from '../messaging';

const listener = new InpageListener();
listener.setPreflightResultHandler(async (call: WalletMethodCall) => {
  return { action: PreflightAction.BLOCK };
});

const manager = new NotificationManager();

manager.on('popup-closed', () => {
  console.log('popup closed');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Installed');
  manager.showPopup();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Startup');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Suspend');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {});
