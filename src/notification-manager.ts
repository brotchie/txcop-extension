import * as EventEmitter from 'events';

const POPUP_WIDTH = 350;
const POPUP_HEIGHT = 500;

export class NotificationManager extends EventEmitter {
  private popupId_: number | null;

  constructor() {
    super();
    this.popupId_ = null;
    chrome.windows.onRemoved.addListener(this._onWindowClosed.bind(this));
  }

  async showPopup() {
    const popup = await this._getPopup();

    if (popup) {
      await chrome.windows.update(popup.id, { focused: true });
    } else {
      let left = 0;
      let top = 0;
      try {
        const lastFocused = await chrome.windows.getLastFocused();
        top = lastFocused.top;
        left = lastFocused.left + (lastFocused.width - POPUP_WIDTH);
      } catch (_) {
        const { screenX, screenY, outerWidth } = window;
        top = Math.max(screenY, 0);
        left = Math.max(screenX + (outerWidth - POPUP_WIDTH), 0);
      }

      const popupWindow = await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        height: POPUP_HEIGHT,
        width: POPUP_WIDTH,
        left,
        top,
      });
      this.popupId_ = popupWindow.id;
    }
  }

  _onWindowClosed(id: number) {
    if (this.popupId_ === id) {
      this.emit('popup-closed');
      this.popupId_ = null;
    }
  }

  async closePopup() {
    if (this.popupId_) {
      return chrome.windows.remove(this.popupId_);
    }
  }

  async _getPopup() {
    const windows = await chrome.windows.getAll();
    return (windows || []).find(
      (window) => window.type === 'popup' && window.id === this.popupId_
    );
  }
}
