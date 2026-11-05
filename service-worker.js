importScripts("lodash.min.js");

const signpostRelations = {
  author: "is authored by",
  collection: "is part of the collection",
  describedby: "is described by",
  describes: "describes the content at",
  item: "has an item at",
  "cite-as": "should be cited as",
  type: "is of the type described at",
  license: "is licensed according to",
  linkset: "has a linkset at",
};

chrome.storage.session.setAccessLevel({
  accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});
chrome.storage.session.clear();

// A link's relation types: rel="describedby", rel=describedby or rel="describedby item" (RFC 8288)
const getRelationsFromLink = (link) => {
  const relRegex = /;\s*rel\s*=\s*(?:"([^"]*)"|([^\s;,"]+))/i;

  const relMatch = link.match(relRegex);

  if (relMatch) {
    return (relMatch[1] ?? relMatch[2]).toLowerCase().split(/\s+/).filter(Boolean);
  }
  return [];
};

// A Link header can hold several links, including non-signposting ones such as rel="preload",
// separated by commas. Split only on commas that start a new <URI>, as URIs may contain commas too.
const splitLinkHeader = (value) => value.split(/,\s*(?=<)/);

const headerHasSignposts = (header) => {
  if (!(header.name.toLowerCase() === "link")) return false;
  return getSignpostsFromHeader(header).length > 0;
};

const getSignpostsFromHeader = (header) => {
  const links = splitLinkHeader(header.value);
  let signposts = [];
  links.forEach((link) => {
    const urlMatch = link.match(/^\s*<([^>]*)>/);
    if (!urlMatch) return;

    const mimetypeRegex = /;\s*type\s*=\s*"([^"]*)"/i;
    const mimetypeMatch = link.match(mimetypeRegex);

    const profileRegex = /;\s*profile\s*=\s*"([^"]*)"/i;
    const profileMatch = link.match(profileRegex);

    getRelationsFromLink(link)
      .filter((rel) => signpostRelations[rel])
      .forEach((rel) => {
        signposts.push({
          url: urlMatch[1],
          relationship: signpostRelations[rel],
          mimetype: mimetypeMatch ? mimetypeMatch[1] : null,
          profile: profileMatch ? profileMatch[1] : null,
        });
      });
  });
  return signposts;
};

const storeSignposts = async (pageUrl, signposts) => {
  const existingSignposts = await chrome.storage.session.get([pageUrl]);
  if (existingSignposts[pageUrl]) {
    await chrome.storage.session.set({
      [pageUrl]: _.uniqBy([...existingSignposts[pageUrl], ...signposts], "url"),
    });
  } else {
    await chrome.storage.session.set({ [pageUrl]: signposts });
  }
};

chrome.webRequest.onHeadersReceived.addListener(
  (details, callback) => {
    const headers = details.responseHeaders;
    let allSignposts = [];
    headers.forEach((header) => {
      if (headerHasSignposts(header)) {
        allSignposts.push(...getSignpostsFromHeader(header));
      }
    });
    if (allSignposts.length) {
      storeSignposts(details.url, allSignposts);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"],
);

function htmlListener () {
  chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    const tabId = details.tabId;

    // Check if the tab is ready (has a tabId)
    if (tabId) {
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          function: findSignpostLinks,
          args: [signpostRelations],
        })
        .then((response) => {
          for (const { result: signposts } of response) {
            if (signposts.length) {
              storeSignposts(details.url, signposts);
            }
          }
        });
    }
  });
}

// Register at the top level, so that the listener is added again whenever Chrome restarts the
// (non-persistent) service worker, not only on install or browser startup.
htmlListener();

function findSignpostLinks(signpostRelations) {
  const links = Array.from(document.querySelectorAll("link"));
  let allSignposts = [];
  links.forEach((link) => {
    // rel may hold several space-separated relation types
    Array.from(link.relList || [])
      .map((rel) => rel.toLowerCase())
      .filter((rel) => !!signpostRelations[rel])
      .forEach((rel) => {
        allSignposts.push({
          url: link.href,
          relationship: signpostRelations[rel],
          mimetype: link.type,
          profile: link.getAttribute("profile"),
        });
      });
  });
  return allSignposts;
}

function setIcon(state) {
  const iconPath = state ? 'logo.png' : 'logo-disabled.png';
  chrome.action.setIcon({ path: iconPath });
}

function actionListener() {
  chrome.storage.local.get(['overlayEnabled'], (result) => {
    const currentState = result.overlayEnabled !== undefined ? result.overlayEnabled : true;
    const newState = !currentState;
    chrome.storage.local.set({ overlayEnabled: newState }, () => {
	  setIcon(newState);
    });
  });
}

chrome.action.onClicked.addListener(actionListener);

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['overlayEnabled'], (result) => {
    console.log("startup overlay state", result.overlayEnabled);
    setIcon(result.overlayEnabled !== undefined ? result.overlayEnabled : true );
  });
});
