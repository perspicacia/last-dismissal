export const hasSystemModifier=event=>Boolean(event.metaKey||event.ctrlKey||event.altKey);

// OS screenshot tools may consume the final key. Release early when the Mac
// Cmd+Shift modifiers reach the page, without cancelling their native action.
export function isCaptureShortcut(event){
 const key=event.code||event.key;
 const mac=event.metaKey&&event.shiftKey&&(['ShiftLeft','ShiftRight','MetaLeft','MetaRight','Shift','Meta','Digit3','Digit4','Digit5'].includes(key)||['3','4','5'].includes(event.key));
 const snip=(event.metaKey||event.ctrlKey)&&event.shiftKey&&(key==='KeyS'||String(event.key).toLowerCase()==='s');
 return Boolean(mac||snip);
}
export function captureCommand(event,{canCapture,capturing}){
 if(!canCapture||event.repeat)return null;
 if(isCaptureShortcut(event))return capturing?null:'capture';
 if(hasSystemModifier(event))return null;
 if(event.code==='KeyP'||String(event.key).toLowerCase()==='p')return capturing?'resume':'capture';
 return null;
}
