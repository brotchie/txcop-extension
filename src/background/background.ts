import { NotificationManager } from '../notification-manager';

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
