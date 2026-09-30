/**
 * Values shared by server and client components. They must not live in 'use client' modules:
 * server imports from those resolve to client references, not the actual values.
 */
export const AGE_COOKIE = 'tene_age_ok';

export const A11Y_STORAGE_KEY = 'tene_a11y_v1';

/** Runs before first paint (inline, nonce'd) so saved accessibility preferences never flash. */
export const A11Y_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${A11Y_STORAGE_KEY}')||'null');if(!p)return;var r=document.documentElement;r.style.setProperty('--a11y-scale',String(Math.min(Math.max(Number(p.scale)||1,0.85),1.5)));r.dataset.contrast=p.contrast?'high':'normal';r.dataset.motion=p.reduceMotion?'reduce':'auto';r.dataset.underline=String(!!p.underlineLinks);r.dataset.font=p.readableFont?'readable':'default';}catch(e){}})();`;
