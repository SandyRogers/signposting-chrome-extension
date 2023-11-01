# Signposting.org browser extension

This Chrome browser extension sniffs for the presence of [signposting.org](https://signposting.org) headers in the HTTP headers (`Link: <http://my.data> rel="describedby"`) or HTML links (`<link href="my.data" rel="describedby/>`).

The presence of such headers is reported as a dismissible banner on the page.

The goal is signposting is to let robot clients navigate to metadata associated with a typically human-readable landing page for a dataset.
The goal of this browser extension is to make those robot-navigable links human-readable.

![Screenshot of a scientific landing page with signposting headers detected](example.png)

## Setup
* Clone this repository
* Open Chrome/Chromium/Chromium-based browsers
* Navigate to [chrome://extensions](chrome://extensions)
* Toggle on "Developer mode"
* "Load unpacked", and select the folder containing the repository
* Browse the scholary web; e.g. try visiting [the HoloFood Data Portal](https://www.holofooddata.org) or [Stian Soiland-Reyes' test pages](https://s11.no/2022/a2a-fair-metrics/).