# 10 · Website version of the redesign

The Group 4 "Renew my visa" redesign built as a complete, working website, the way IremboGov would look after the update. It has no presentation tools. For the class walkthrough with annotations, use `09_Interactive_Prototype/`.

## Open it
Double-click **`index.html`**. It works offline. To put it online, upload the whole folder to any static host (GitHub Pages, Netlify). There is no server code. Keep the footer line saying it is a concept and not the official service (see "Limits").

## Pages
| Page | What it does |
|---|---|
| `index.html` | Home: service search, services, "continue where you left off", how it works, privacy |
| `renew-visa.html` | Service page: documents checklist, fees, privacy, FAQ, Start |
| `apply.html` | 4-step form (Your visa · About you · Documents · Check & submit). **Saves as you type**, so you can close it and continue later. Real photo/PDF checks + "Make it fit for me" |
| `application.html?no=…` | Step 5 Pay (MoMo, Airtel, card, USSD), status timeline, payment-expired recovery, printable receipt |
| `find.html` | Find by application number, Bill ID or phone |
| `my-applications.html` | All applications on this device: continue, pay, new code, delete draft |
| `help.html` | Call 9099, FAQ, agent finder by district, privacy |

Shared: `css/site.css` (design v2), `css/fonts.css`, `js/theme.js` (applies light/dark + text size before the page draws), `js/core.js` (header, footer, storage, Aa+ / Dark mode remembered across pages, help button).

## Design v2 (from the `irembogov-redesign` export, 22 Nov 2026)
The visual design (Public Sans, light/dark theme, rounded cards, tick-off checklist, method cards) comes from the `irembogov-redesign` design export. It was applied to these working pages, so every function still works. The export itself was only a click-through mock: its uploads, validation, Find and payment were fake and its application number was fixed.
- **Works offline:** the fonts (`assets/fonts/`, SIL Open Font License) and icons (`assets/icons/`) are stored in the project. The export loaded them from the internet.
- **Icons:** Dazzle Line Icons by Dazzle UI (CC BY). Keep the attribution in the footer.
- **Paying:** choose a method card, then press "Pay … RWF".

## How data works
Applications are stored in the browser (`localStorage`) and never sent anywhere. Statuses use the team vocabulary: Draft → Payment pending → Payment expired / Under review.

## For demos
- Payments are **simulated**: MoMo/Airtel confirm after ~7 s, USSD after ~9 s, card after "Continue to secure payment". The card option does not ask for card numbers; a real site sends people to the bank's own page.
- To show the expired-code recovery, add `&expire=1` to an application URL, e.g. `application.html?no=B2-1234-2026&expire=1`.
- To start fresh: browser DevTools → Application → Local storage → clear.

## Limits (be honest in the report)
Fees, photo rules, the USSD code and the agent list are **sample data**. Only English is built (RW/FR show a "coming soon" message). Services other than Renew visa link to the current irembo.gov.rw. It has not been tested with real users yet (PENDING, Evaluation Lead). Do not remove the footer disclaimer if you host it: an unofficial page that looks like a government portal and asks for passport data can be mistaken for phishing.

## Access control (who may see or change an application)
Knowing an application number is not enough:
- **Application number or Bill ID:** shows the status only (no name, no details). Paying is allowed, because paying someone else's fee does them no harm.
- **Phone number, seeing details or the receipt, continuing a draft, changing answers:** a 6-digit code is sent by SMS to the phone in the application. It is valid for 5 minutes, allows 3 tries, and unlocks for 30 minutes.
- The person who started an application in the same browser session needs no code. Closing the browser, or **My applications > Sign out on this device**, locks it again (for cyber cafes and agents).
- **SMS is simulated:** the code appears in a message box at the top right. A real system would also use long random application numbers and limit how many searches someone can make.
