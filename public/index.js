let deferredPrompt;

const btnApp = document.getElementById("btn-app");

if (isAddToHomeScreenSupported()) {
  console.log("Supported");
} else {
  console.log("Not supported");
}

if (!navigator.serviceWorker.controller) {
  navigator.serviceWorker.register("/sw.js").then(function (reg) {
    console.log("Service worker has been registered for scope: " + reg.scope);
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("Ok we ready");
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  btnApp.style.display = "block";
});

btnApp.addEventListener("click", handleInstallApp);

function handleInstallApp(e) {
  btnApp.style.display = "none";

  deferredPrompt.prompt();

  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the A2HS prompt");
    } else {
      console.log("User dismissed the A2HS prompt");
    }
    deferredPrompt = null;
  });
}

function isAddToHomeScreenSupported() {
  return "getInstalledRelatedApps" in window.navigator;
}
