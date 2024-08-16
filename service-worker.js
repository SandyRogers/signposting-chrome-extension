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
};

chrome.storage.session.setAccessLevel({
  accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});
chrome.storage.session.clear();

const getRelationFromHeaderValue = (value) => {
  const relRegex = /rel="?([a-z, A-Z, -]*)"?/;

  const relMatch = value.match(relRegex);

  if (relMatch) {
    return relMatch[1].toLowerCase();
  }
  return;
};

const headerHasSignposts = (header) => {
  if (!(header.name.toLowerCase() === "link")) return false;
  if (header.value.indexOf("rel") < 0) return false;
  const rel = getRelationFromHeaderValue(header.value);

  if (signpostRelations[rel]) return true;
  return false;
};

const getSignpostsFromHeader = (header) => {
  const hval = header.value;
  const links = hval.split(",");
  let signposts = [];
  links.forEach((link) => {
    const rel = getRelationFromHeaderValue(link);

    if (!signpostRelations[rel]) return;

    const urlRegex = /(?<=<)([^>]+)(?=>)/g;
    const urlMatches = link.match(urlRegex);

    const mimetypeRegex = /type="([^"]*)"/;
    const mimetypeMatch = link.match(mimetypeRegex);

    const profileRegex = /profile="([^"]*)"/;
    const profileMatch = link.match(profileRegex);

    const signpost = {
      url: urlMatches[0],
      relationship: signpostRelations[rel],
      mimetype: mimetypeMatch ? mimetypeMatch[1] : null,
      profile: profileMatch ? profileMatch[1] : null,
    };

    signposts.push(signpost);
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

chrome.runtime.onInstalled.addListener(htmlListener);
chrome.runtime.onStartup.addListener(htmlListener);

function findSignpostLinks(signpostRelations) {
  const links = Array.from(document.querySelectorAll("link"));
  let allSignposts = [];
  links.forEach((link) => {
    if (link.rel && !!signpostRelations[link.rel.toLowerCase()]) {
      allSignposts.push({
        url: link.href,
        relationship: signpostRelations[link.rel.toLowerCase()],
        mimetype: link.type,
        profile: null,
      });
    }
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
