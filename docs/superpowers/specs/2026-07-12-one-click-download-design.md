# One-click simulator download

## Goal

Let a non-technical visitor download the deterministic simulator from the README with one click, without downloading the repository or navigating GitHub release assets.

## Design

- Place a prominent **Download Retirement Simulator** link directly below the opening warning and screenshot area.
- Link to `https://github.com/dcaddick/retirement-simulator/releases/latest/download/retirement-simulator.html` so the README always targets the newest published release.
- Explain in one short line that it is a single HTML file, needs no installation and opens locally in a modern browser.
- Keep the existing clone/download instructions for technical users.

## Release requirement

Every GitHub release must attach the deterministic simulator using the exact asset filename `retirement-simulator.html`. Publishing a release without that asset would make the stable README link return an error.

## Verification

- Confirm the README link is the stable `/releases/latest/download/retirement-simulator.html` URL.
- Confirm the next release contains an asset with that exact filename.
- Open the link in a signed-out browser and verify that it downloads the HTML file.
