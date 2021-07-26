(function () {
  const BANNER_LOCAL_STORAGE_KEY = "ADD_TO_HOME_SCREEN_BANNER";
  // Days * hours * mins * seconds * 1000
  // const BANNER_INTERVAL_MIL_SECONDS = 10 * 24 * 60 * 60 * 1000;
  const BANNER_INTERVAL_MIL_SECONDS = 10 * 1000;
  const SERVICE_WORKER_PATH = "./sw.js";
  const IOS_SAFARI_BANNER_ID = "safari-banner";
  const INSTALL_APP_BANNER_ID = "add-banner";
  const INSTALL_APP_BUTTON_ID = "add-banner-button";
  const BANNER_CLOSE_CLASS_NAME = "add-app-banner-close";
  const CLEAR_BANNER_HISTORY_PARAM = "pwa-clear-banner";

  let banner;
  let deferredPrompt;

  docReady(main());

  function main() {
    // Just for development purpose
    // If you testing on a device, you can pass the value of CLEAR_BANNER_HISTORY_PARAM=true as query param
    // example ?pwa-clear-banner=true
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(CLEAR_BANNER_HISTORY_PARAM);
    if (param) {
      clearBannerHistory();
    }
    //

    // install service worker first
    installServiceWorker(SERVICE_WORKER_PATH);

    // add event listner for close buttons
    addCloseHandlersForBanners();

    // Check to see if add to home screen is supported
    const safariMobile = isSafariMobile();
    if (!isAddToHomeScreenSupported()) {
      if (safariMobile) {
        //check for interval
        if (shouldRenderBanner()) {
          showSafariMobileBanner();
        }
        return;
      }
      // edge cases that we don't support
      // Chrome on iOS etc
      console.log("A2HS not supported");
      return false;
    }

    // stop the default behaviour
    window.addEventListener("beforeinstallprompt", beforeInstallHandler);

    // add event listner for add to homescreen button
    addToHomeScreenEventListner();
  }

  // Package
  function isAddToHomeScreenSupported() {
    return "getInstalledRelatedApps" in window.navigator;
  }

  function isSafariMobile() {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i);
  }

  function installServiceWorker(swPath) {
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker.register(swPath).then(function (reg) {
        console.log(
          "Service worker has been registered for scope: " + reg.scope
        );
      });
    }
  }

  function handleInstallApp(e) {
    deferredPrompt.prompt();
    return deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the A2HS prompt");
        // now that accepted let's remove the banner
        removeAddToHomeScreenBanner();
      } else {
        console.log("User dismissed the A2HS prompt");
      }
      deferredPrompt = null;
    });
  }

  function showSafariMobileBanner() {
    const element = document.getElementById(IOS_SAFARI_BANNER_ID);
    element.style.display = "block";
    banner = element;
  }

  function removeSafariBanner() {
    const element = document.getElementById(IOS_SAFARI_BANNER_ID);
    element.style.display = "none";
    banner = null;
  }

  function showAdToHomeScreenBanner() {
    const element = document.getElementById(INSTALL_APP_BANNER_ID);
    element.style.display = "block";
    banner = element;
  }

  function removeAddToHomeScreenBanner() {
    const element = document.getElementById(INSTALL_APP_BANNER_ID);
    element.style.display = "none";
    banner = null;
  }

  function beforeInstallHandler(e) {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    if (shouldRenderBanner()) {
      showAdToHomeScreenBanner();
    }

    // Stash the event so it can be triggered later.
    deferredPrompt = e;
  }

  function shouldRenderBanner() {
    if (isStandAlone()) {
      return false;
    }
    try {
      const lastTimeShowed = localStorage.getItem(BANNER_LOCAL_STORAGE_KEY);
      if (!lastTimeShowed) {
        return true;
      }
      const now = Date.now();
      if (now - +lastTimeShowed > BANNER_INTERVAL_MIL_SECONDS) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
    }
  }

  function persistBannerDate() {
    try {
      localStorage.setItem(BANNER_LOCAL_STORAGE_KEY, Date.now());
    } catch (error) {
      console.error(error);
    }
  }

  function clearBannerHistory() {
    try {
      localStorage.removeItem(BANNER_LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error(error);
    }
  }

  function closeBannerHandler(e) {
    banner.style.display = "none";
    persistBannerDate();
  }

  function addCloseHandlersForBanners() {
    const elements = document.getElementsByClassName(BANNER_CLOSE_CLASS_NAME);
    Array.from(elements).forEach(function (element) {
      element.addEventListener("click", closeBannerHandler);
    });
  }

  function addToHomeScreenEventListner() {
    const element = document.getElementById(INSTALL_APP_BUTTON_ID);
    element.addEventListener("click", handleInstallApp);
  }

  function docReady(fn) {
    // see if DOM is already available
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      // call on next available tick
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  // user already added to thier home screen
  function isStandAlone() {
    return window.navigator.standalone;
  }
})();
