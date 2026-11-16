import { app } from 'electron'

// The few strings the main process shows itself: tray menu, splash screen,
// native file dialogs and the macOS menu bar. Everything else is translated
// in the renderer.
const STRINGS = {
  tr: {
    appName: 'Proje Yöneticisi',
    splashSub: 'Projelerin yükleniyor…',
    trayFavorites: 'Favoriler',
    trayRecent: 'Son Açılanlar',
    trayOpen: 'Uygulamayı Aç',
    trayQuit: 'Çıkış',
    pickFolder: 'Proje klasörü seç',
    exportTitle: 'Verileri dışa aktar',
    importTitle: 'Yedeği içe aktar',
    jsonFiles: 'JSON dosyaları',
    // macOS menu bar
    menuAbout: 'Proje Yöneticisi Hakkında',
    menuSettings: 'Ayarlar…',
    menuHide: "Proje Yöneticisi'ni Gizle",
    menuHideOthers: 'Diğerlerini Gizle',
    menuShowAll: 'Tümünü Göster',
    menuQuit: "Proje Yöneticisi'nden Çık",
    menuEdit: 'Düzen',
    menuUndo: 'Geri Al',
    menuRedo: 'Yinele',
    menuCut: 'Kes',
    menuCopy: 'Kopyala',
    menuPaste: 'Yapıştır',
    menuSelectAll: 'Tümünü Seç',
    menuView: 'Görünüm',
    menuFullScreen: 'Tam Ekran',
    menuWindow: 'Pencere',
    menuMinimize: 'Küçült',
    menuZoom: 'Büyüt/Küçült',
    menuClose: 'Pencereyi Kapat',
    menuFront: 'Tümünü Öne Getir'
  },
  en: {
    appName: 'Project Manager',
    splashSub: 'Loading your projects…',
    trayFavorites: 'Favorites',
    trayRecent: 'Recently opened',
    trayOpen: 'Open app',
    trayQuit: 'Quit',
    pickFolder: 'Choose a project folder',
    exportTitle: 'Export data',
    importTitle: 'Import a backup',
    jsonFiles: 'JSON files',
    // macOS menu bar
    menuAbout: 'About Project Manager',
    menuSettings: 'Settings…',
    menuHide: 'Hide Project Manager',
    menuHideOthers: 'Hide Others',
    menuShowAll: 'Show All',
    menuQuit: 'Quit Project Manager',
    menuEdit: 'Edit',
    menuUndo: 'Undo',
    menuRedo: 'Redo',
    menuCut: 'Cut',
    menuCopy: 'Copy',
    menuPaste: 'Paste',
    menuSelectAll: 'Select All',
    menuView: 'View',
    menuFullScreen: 'Toggle Full Screen',
    menuWindow: 'Window',
    menuMinimize: 'Minimize',
    menuZoom: 'Zoom',
    menuClose: 'Close Window',
    menuFront: 'Bring All to Front'
  }
}

let lang = 'en'

// 'auto' follows the OS locale. Must be called after app 'ready', since
// app.getLocale() is not meaningful before that.
export function setLanguage(setting) {
  if (setting === 'tr' || setting === 'en') {
    lang = setting
  } else {
    lang = (app.getLocale() || '').toLowerCase().startsWith('tr') ? 'tr' : 'en'
  }
}

export function t(key) {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}
