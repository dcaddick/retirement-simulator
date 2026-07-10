# Security and privacy reporting

This project is a local browser application, but retirement scenarios may contain highly sensitive personal and financial information.

## Never publish a real scenario

Do not attach scenario JSON, screenshots containing personal figures, account statements, tax records or identifying filenames to a public issue or pull request.

Use fictional values to reproduce a problem. Remove names, balances, salaries, holdings, pension details, local paths and browser-storage content before sharing logs or screenshots.

## Reporting a vulnerability

For an ordinary bug that can be demonstrated safely, open a GitHub issue with fictional reproduction data.

For a vulnerability that could expose local scenario data, do not include exploit details or personal data in a public issue. Use GitHub's private vulnerability reporting feature if it is available for the repository.

## Scope

The core tools are designed to run locally and do not provide accounts, authentication, cloud storage or a hosted service. Browser local storage and exported JSON are not encrypted. Users are responsible for protecting exported files and controlling who can access their device.

The software is provided without warranty under Apache License 2.0.
