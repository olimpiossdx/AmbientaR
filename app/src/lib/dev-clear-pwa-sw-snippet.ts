/**
 * Script inline no <head> em desenvolvimento — corre ANTES dos chunks do Next.
 * O SW do Workbox (public/sw.js de um build antigo) intercepta /_next/static e causa 404.
 */
export const DEV_CLEAR_PWA_SW_SNIPPET = `(function(){
  if(typeof navigator==="undefined"||!navigator.serviceWorker)return;
  navigator.serviceWorker.getRegistrations().then(function(regs){
    regs.forEach(function(r){
      var u=(r.active&&r.active.scriptURL)||(r.installing&&r.installing.scriptURL)||"";
      if(u.indexOf("firebase-messaging-sw")>=0)return;
      r.unregister();
    });
  });
  if(typeof caches!=="undefined"){
    caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k);});});
  }
})();`;
