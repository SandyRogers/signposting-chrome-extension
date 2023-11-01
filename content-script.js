const logo = chrome.runtime.getURL("logo.svg");
const copyIcon = chrome.runtime.getURL("copy.svg");
const logoHTML = `<img width="24px" height="24px" src="${logo}" style="position: absolute; left: 8px; top: 0; bottom: 0; margin: auto 0"/>`;
const closeLinkHTML = `<a href="#" onClick="javascript:document.getElementById(\'signposting-org-notices\').remove()" style="right: 8px; top: 4px; position: absolute; text-decoration: none; color: #d41645; font-size: 28px;">×</a>`;

const signpostingIntro = `Signposting.org metadata: this page`;

const copyButtonStyle =
  "background: none; border: none; padding: 4px 0 0 0; cursor: pointer;";

const renderSignpost = (signpost) => {
  let signpostBar = document.getElementById("signposting-org-notices");
  if (!signpostBar) {
    signpostBar = document.createElement("div");
    signpostBar.id = "signposting-org-notices";
    signpostBar.style.backgroundColor = "#fdd757";
    signpostBar.style.position = "fixed";
    signpostBar.style.top = "8px";
    signpostBar.style.left = "8px";
    signpostBar.style.right = "8px";
    signpostBar.style.zIndex = 9999;
    signpostBar.style.fontSize = "16px";
    signpostBar.style.padding = "16px 16px 16px 40px";
    signpostBar.style.borderRadius = "4px";
    signpostBar.style.fontFamily = "sans-serif";
    document.body.appendChild(signpostBar);

    signpostBar.innerHTML = `${logoHTML}${closeLinkHTML}`;
  }
  const existingHTML = signpostBar.innerHTML;
  let signpostingLinkHTML = `<a href="${signpost.url}">${signpost.url}</a>`;
  if (signpost.mimetype) {
    signpostingLinkHTML = `${signpostingLinkHTML} (${signpost.mimetype})`;
  }
  if (signpost.profile) {
    signpostingLinkHTML = `${signpostingLinkHTML} with a profile at <a href="${signpost.profile}">${signpost.profile}</a>`;
  }

  const copyButtonHTML = `<button onClick="javascript:navigator.clipboard.writeText('${signpost.url}')" style="${copyButtonStyle}"><img src="${copyIcon}" height="16px"/></button>`;

  signpostBar.innerHTML = `${existingHTML}${signpostingIntro} ${signpost.relationship} ${signpostingLinkHTML} ${copyButtonHTML}<br/>`;
};

(async () => {
  const pageUrl = document.location.href;
  const signposts = await chrome.storage.session.get([pageUrl]);
  if (signposts[pageUrl]) {
    signposts[pageUrl].forEach(renderSignpost);
  }
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const [key, { newValue: signposts }] of Object.entries(changes)) {
    if (key === document.location.href) {
      if (signposts) {
        document.getElementById("signposting-org-notices").remove();
        signposts.forEach(renderSignpost);
      }
    }
  }
});
