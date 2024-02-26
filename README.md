# Signposting.org browser extension

This Chrome browser extension sniffs for the presence of [signposting.org](https://signposting.org) headers in the HTTP headers (`Link: <http://my.data> rel="describedby"`) or HTML links (`<link href="my.data" rel="describedby/>`).

The presence of such headers is reported as a dismissible banner on the page.

The goal of signposting is to let robot clients navigate to metadata associated with a typically human-readable landing page for a dataset.
The goal of this browser extension is to make those robot-navigable links human-readable.

![Screenshot of a scientific landing page with signposting headers detected](example.png)

## Installation

[Install the extension from the chrome web store.](https://chromewebstore.google.com/detail/signposting-sniffing/pahanegeimljfcnjogglnamnlcgipmbc)

## Developer Setup
* Clone this repository
* Open Chrome/Chromium/Chromium-based browsers
* Navigate to [chrome://extensions](chrome://extensions)
* Toggle on "Developer mode"
* "Load unpacked", and select the folder containing the repository
* Browse the scholarly web; e.g. try visiting [a sample on the HoloFood Data Portal](https://www.holofooddata.org/sample/SAMEA10104908) or [Stian Soiland-Reyes' test pages](https://s11.no/2022/a2a-fair-metrics/).

## Status
This extension is a PoC.

## Contributions
Are very welcome via Issues and/or Pull Requests.

## Privacy and data collection
This extension requires several permissions to read the data in your web browser.
These permissions are required so that the extension can read the presence and content of Signposting links in both the HTTP headers, and the HTML content, of the scholarly webpages you are visiting / developing.
The current permissions required are detailed in the `manifest.json` file of this code repostiory.
Note that none of the data collected and/or created by these permissions is sent over the network to any remote code or database.
Neither the developers of this extension, nor the owners of the signposted websites you visit, receive any additional information collected or processed by this extension. It is purely a client side (i.e., in your browser) extension to help with development and discovery of the scholarly web.


### Notable lacking features:

- support for Signposting in [Linksets](https://signposting.org/linkset/)
- warning of / deterministic resolution of clashing headers between HTTP and HTML
- test suite (perhaps running through [s11.no/2022/a2a-fair-metrics/](https://s11.no/2022/a2a-fair-metrics/)?)
- encapsulated CSS
- arguably unneccesary use of storage API; could be achieved with message handlers instead
- Firefox / Edge version

