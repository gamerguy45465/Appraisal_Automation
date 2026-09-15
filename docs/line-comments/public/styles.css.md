# Line explanations: public/styles.css

Source: [public/styles.css](../../../public/styles.css). Numbers refer to the original file before comments were added.

The source also contains these explanations as comments. Comments for lines inside literal strings or other protected syntax appear at the nearest safe boundary.

| Original line | Explanation |
| ---: | --- |
| 1 | Begins document-wide design variables and inherited base typography/color settings. |
| 2 | Defines reusable design variable --ink as #1a3039. |
| 3 | Defines reusable design variable --muted as #5e6d73. |
| 4 | Defines reusable design variable --teal as #235b59. |
| 5 | Defines reusable design variable --teal-dark as #163f3e. |
| 6 | Defines reusable design variable --line as #e3e6e2. |
| 7 | Defines reusable design variable --paper as #ffffff. |
| 8 | Defines reusable design variable --canvas as #f5f5f0. |
| 9 | Defines reusable design variable --soft-teal as #edf4f0. |
| 10 | Defines reusable design variable --danger as #923b2d. |
| 11 | Defines reusable design variable --radius as 16px. |
| 12 | Sets font fallback stack to "Segoe UI", -apple-system, BlinkMacSystemFont, Arial, sans-serif. |
| 13 | Sets text/foreground color to var(--ink). |
| 14 | Sets background to var(--canvas). |
| 15 | Sets synthetic font-face generation to none. |
| 16 | Sets WebKit font smoothing to antialiased. |
| 17 | Ends the document-root style rule. |
| 18 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 19 | For elements matching *: Sets width/height box measurement to border-box. |
| 20 | For elements matching body: Sets outer spacing to 0; Sets text size to 14px; Sets line spacing to 1.5. |
| 21 | For elements matching button, input, select: Sets font settings to inherit. |
| 22 | For elements matching button, a, input, select, summary: Sets touch highlight color to transparent. |
| 23 | For elements matching button, summary: Sets pointer appearance to pointer. |
| 24 | For elements matching button:disabled: Sets pointer appearance to wait. |
| 25 | For elements matching button, input, select: Sets animated property transitions to border-color 150ms, background-color 150ms, box-shadow 150ms. |
| 26 | For elements matching :focus-visible: Sets focus outline to 3px solid #4b9391; Sets outline distance to 3px. |
| 27 | For elements matching svg: Sets layout/display mode to block. |
| 28 | For elements matching input:disabled, select:disabled: Sets text/foreground color to var(--muted); Sets background to #f7f8f6; Sets opacity to 1. |
| 29 | For elements matching input:disabled, select:disabled, fieldset:disabled label, fieldset:disabled summary: Sets pointer appearance to default. |
| 30 | For elements matching [hidden]: Sets layout/display mode to none !important. |
| 31 | For elements matching .sr-only: Sets positioning mode to absolute; Sets width to 1px; Sets height to 1px; Sets inner spacing to 0; Sets outer spacing to -1px; Sets overflow handling to hidden; Sets legacy clipping rectangle to rect(0, 0, 0, 0); Sets whitespace wrapping to nowrap; Sets border to 0. |
| 32 | For elements matching .skip-link: Sets positioning mode to fixed; Sets left offset to 20px; Sets top offset to -70px; Sets stacking level to 10; Sets inner spacing to 10px 16px; Sets corner rounding to 5px; Sets text/foreground color to white; Sets background to var(--teal). |
| 33 | For elements matching .skip-link:focus: Sets top offset to 10px. |
| 34 | For elements matching .site-header: Sets background to #fff; Sets bottom border to 1px solid var(--line). |
| 35 | For elements matching .header-inner: Sets width to min(1180px, calc(100% - 80px)); Sets height to 86px; Sets outer spacing to auto; Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets main-axis distribution to space-between; Sets spacing between layout items to 24px. |
| 36 | For elements matching .brand: Sets layout/display mode to inline-flex; Sets cross-axis alignment to center; Sets spacing between layout items to 12px; Sets text decoration to none; Sets text/foreground color to var(--ink); Sets text size to 24px; Sets font weight to 700; Sets character spacing to -1px. |
| 37 | For elements matching .brand-light: Sets font weight to 400; Sets left outer spacing to 3px. |
| 38 | For elements matching .brand-mark: Sets layout/display mode to grid; Sets grid alignment in both axes to center; Sets width to 44px; Sets height to 44px; Sets corner rounding to 12px; Sets background to var(--teal); Sets text/foreground color to #fff. |
| 39 | For elements matching .brand-mark svg: Sets width to 30px; Sets height to 30px. |
| 40 | For elements matching .workspace-label: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets spacing between layout items to 8px; Sets inner spacing to 7px 12px; Sets border to 1px solid var(--line); Sets corner rounding to 30px; Sets text/foreground color to #566568; Sets text size to 12px; Sets font weight to 500. |
| 41 | For elements matching .small-dot: Sets width to 6px; Sets height to 6px; Sets corner rounding to 50%; Sets background to var(--teal). |
| 42 | For elements matching .page-shell: Sets width to min(1180px, calc(100% - 80px)); Sets outer spacing to auto. |
| 43 | For elements matching .page-intro: Sets layout/display mode to flex; Sets cross-axis alignment to flex-end; Sets main-axis distribution to space-between; Sets spacing between layout items to 32px; Sets inner spacing to 47px 0 36px. |
| 44 | For elements matching .eyebrow: Sets outer spacing to 0; Sets text size to 10px; Sets font weight to 700; Sets character spacing to 1.9px; Sets text/foreground color to var(--teal). |
| 45 | For elements matching h1: Sets outer spacing to 13px 0 15px; Sets text size to clamp(35px, 3.5vw, 45px); Sets line spacing to 1.14; Sets font weight to 600; Sets character spacing to -1.8px. |
| 46 | For elements matching h1 span: Sets text/foreground color to var(--teal). |
| 47 | For elements matching .intro-copy: Sets maximum width to 565px; Sets outer spacing to 0; Sets text/foreground color to var(--muted); Sets text size to 15px; Sets line spacing to 1.7. |
| 48 | For elements matching .branch-tag: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets spacing between layout items to 12px; Sets inner spacing to 16px 0 8px; Sets flex shrinking factor to 0. |
| 49 | For elements matching .branch-tag &gt; svg: Sets width to 26px; Sets height to 26px; Sets text/foreground color to #6b807b. |
| 50 | For elements matching .branch-tag span: Sets layout/display mode to block; Sets text/foreground color to var(--muted); Sets text size to 9px; Sets character spacing to 1.5px; Sets bottom outer spacing to 3px. |
| 51 | For elements matching .branch-tag strong: Sets text size to 11px; Sets font weight to 600; Sets character spacing to 0.25px. |
| 52 | For elements matching .workspace-grid: Sets layout/display mode to grid; Sets grid column sizes to minmax(0, 1fr) 330px; Sets spacing between layout items to 28px; Sets cross-axis alignment to start. |
| 53 | For elements matching .order-card: Sets background to var(--paper); Sets border to 1px solid var(--line); Sets corner rounding to var(--radius); Sets overflow handling to hidden; Sets shadow to 0 3px 12px #193f3610. |
| 54 | For elements matching .card-heading: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets main-axis distribution to space-between; Sets inner spacing to 24px 32px; Sets bottom border to 1px solid var(--line); Sets spacing between layout items to 16px. |
| 55 | For elements matching .card-heading h2: Sets outer spacing to 0; Sets text size to 19px; Sets font weight to 600; Sets character spacing to -0.3px. |
| 56 | For elements matching .card-heading &gt; span: Sets text size to 11px; Sets text/foreground color to var(--muted). |
| 57 | For elements matching .required-mark: Sets text/foreground color to var(--teal). |
| 58 | For elements matching .form-fields: Sets border to 0; Sets inner spacing to 0 32px; Sets outer spacing to 0; Sets minimum width to 0. |
| 59 | For elements matching .form-section: Sets bottom border to 1px solid var(--line); Sets inner spacing to 29px 0 30px. |
| 60 | For elements matching .last-section: Sets bottom border to 0. |
| 61 | For elements matching .section-heading: Sets layout/display mode to flex; Sets cross-axis alignment to flex-start; Sets spacing between layout items to 12px; Sets bottom outer spacing to 23px. |
| 62 | For elements matching .section-number: Sets layout/display mode to inline-grid; Sets grid alignment in both axes to center; Sets flex shrinking factor to 0; Sets width to 29px; Sets height to 29px; Sets top outer spacing to 1px; Sets border to 1px solid #dbe7df; Sets corner rounding to 8px; Sets text/foreground color to var(--teal); Sets background to #f4f8f4; Sets text size to 10px; Sets font weight to 600. |
| 63 | For elements matching .section-heading h3: Sets outer spacing to 0; Sets text size to 16px; Sets font weight to 600; Sets character spacing to -0.25px. |
| 64 | For elements matching .section-heading p: Sets outer spacing to 3px 0 0; Sets text size to 12px; Sets text/foreground color to var(--muted). |
| 65 | For elements matching .field: Sets minimum width to 0. |
| 66 | For elements matching .form-section &gt; .field + .field: Sets top outer spacing to 19px. |
| 67 | For elements matching .field + .field-grid: Sets top outer spacing to 19px. |
| 68 | For elements matching .field-grid: Sets layout/display mode to grid; Sets grid column sizes to repeat(2, minmax(0, 1fr)); Sets spacing between layout items to 20px. |
| 69 | For elements matching .field label, .document-field &gt; label: Sets layout/display mode to block; Sets bottom outer spacing to 8px; Sets text size to 12px; Sets font weight to 600. |
| 70 | For elements matching .field label .required-mark, .document-field &gt; label .required-mark: Sets left inner spacing to 2px. |
| 71 | For elements matching .optional-label: Sets left outer spacing to 5px; Sets text size to 10px; Sets font weight to 400; Sets text/foreground color to var(--muted). |
| 72 | For elements matching .field input, .field select: Sets width to 100%; Sets height to 45px; Sets inner spacing to 10px 13px; Sets text/foreground color to var(--ink); Sets background color to #fff; Sets border to 1px solid #cbd3ce; Sets corner rounding to 7px; Sets text size to 13px. |
| 73 | For elements matching .field input::placeholder: Sets text/foreground color to #788480; Sets opacity to 1. |
| 74 | For elements matching .field input:hover:not(:disabled), .field select:hover:not(:disabled): Sets border color to #8ca59c. |
| 75 | For elements matching .field input:focus, .field select:focus: Sets border color to var(--teal); Sets focus outline to 2px solid #235b5920; Sets outline distance to 1px. |
| 76 | For elements matching .field input[aria-invalid="true"], input[type="file"][aria-invalid="true"]: Sets border color to var(--danger). |
| 77 | For elements matching .field select: Sets right inner spacing to 30px. |
| 78 | For elements matching .field-help: Sets outer spacing to 7px 0 0; Sets text size to 11px; Sets line spacing to 1.6; Sets text/foreground color to var(--muted). |
| 79 | For elements matching .advanced-settings: Sets top outer spacing to 20px; Sets text size to 11px; Sets text/foreground color to var(--muted). |
| 80 | For elements matching .advanced-settings summary: Sets width to fit-content; Sets inner spacing to 4px 0. |
| 81 | For elements matching .advanced-settings[open] summary: Sets bottom outer spacing to 12px; Sets text/foreground color to var(--teal). |
| 82 | For elements matching .advanced-settings .field: Sets inner spacing to 15px; Sets corner rounding to 8px; Sets background to #f7f9f6. |
| 83 | For elements matching .document-grid: Sets layout/display mode to grid; Sets grid column sizes to repeat(2, minmax(0, 1fr)); Sets spacing between layout items to 16px. |
| 84 | For elements matching .document-field: Sets minimum width to 0; Sets inner spacing to 17px; Sets border to 1px dashed #baccc0; Sets corner rounding to 9px; Sets background to #fafcf9. |
| 85 | For elements matching .document-field:focus-within: Sets border color to var(--teal); Sets background to #f3f8f2. |
| 86 | For elements matching .document-top: Sets layout/display mode to flex; Sets cross-axis alignment to flex-start; Sets main-axis distribution to space-between; Sets bottom outer spacing to 12px. |
| 87 | For elements matching .document-icon: Sets text/foreground color to var(--teal). |
| 88 | For elements matching .document-icon svg: Sets height to 29px; Sets width to 29px. |
| 89 | For elements matching .file-type: Sets text size to 9px; Sets character spacing to 0.5px; Sets text/foreground color to #5e7972; Sets border to 1px solid #d8e3d9; Sets corner rounding to 4px; Sets inner spacing to 2px 5px. |
| 90 | For elements matching .document-field &gt; label: Sets bottom outer spacing to 3px. |
| 91 | For elements matching .document-description: Sets outer spacing to 0 0 16px; Sets minimum height to 32px; Sets text size to 11px; Sets text/foreground color to var(--muted). |
| 92 | For elements matching input[type="file"]: Sets layout/display mode to block; Sets width to 100%; Sets maximum width to 100%; Sets text size to 10px; Sets text/foreground color to var(--muted); Sets overflow handling to hidden; Sets corner rounding to 5px. |
| 93 | For elements matching input[type="file"]::file-selector-button: Sets inner spacing to 7px 9px; Sets right outer spacing to 7px; Sets border to 1px solid #bdcec4; Sets corner rounding to 5px; Sets text/foreground color to var(--teal); Sets background to #fff; Sets font fallback stack to inherit; Sets text size to 10px; Sets font weight to 600; Sets pointer appearance to pointer. |
| 94 | For elements matching input[type="file"]::file-selector-button:hover: Sets background to #edf5ee. |
| 95 | For elements matching input[type="file"]:disabled::file-selector-button: Sets pointer appearance to default. |
| 96 | For elements matching .file-selection: Sets outer spacing to 8px 0 0; Sets text size to 10px; Sets text/foreground color to var(--muted); Sets long-word wrapping to anywhere. |
| 97 | For elements matching .file-selection[data-selected="true"]: Sets text/foreground color to var(--teal). |
| 98 | For elements matching .checkbox-field: Sets layout/display mode to flex; Sets cross-axis alignment to flex-start; Sets spacing between layout items to 10px; Sets top outer spacing to 21px; Sets pointer appearance to pointer. |
| 99 | For elements matching .checkbox-field input: Sets width to 16px; Sets height to 16px; Sets flex shrinking factor to 0; Sets outer spacing to 3px 0 0; Sets native control accent color to var(--teal). |
| 100 | For elements matching .checkbox-field &gt; span: Sets layout/display mode to grid; Sets spacing between layout items to 4px. |
| 101 | For elements matching .checkbox-field strong: Sets font weight to 500; Sets text size to 12px. |
| 102 | For elements matching .checkbox-field span span: Sets text/foreground color to var(--muted); Sets text size to 11px. |
| 103 | For elements matching .form-footer: Sets inner spacing to 22px 32px 24px; Sets top border to 1px solid var(--line); Sets background to #fbfcfa. |
| 104 | For elements matching .form-footer &gt; p:first-child: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets main-axis distribution to center; Sets spacing between layout items to 6px; Sets text/foreground color to var(--muted); Sets text size to 10px; Sets outer spacing to 0 0 17px. |
| 105 | For elements matching .form-footer &gt; p:first-child svg: Sets width to 15px; Sets height to 15px; Sets flex shrinking factor to 0. |
| 106 | For elements matching .primary-button: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets main-axis distribution to center; Sets spacing between layout items to 15px; Sets width to 100%; Sets minimum height to 49px; Sets inner spacing to 12px 18px; Sets border to 1px solid var(--teal); Sets corner rounding to 7px; Sets text/foreground color to white; Sets background to var(--teal); Sets text size to 13px; Sets font weight to 600. |
| 107 | For elements matching .primary-button svg: Sets width to 19px; Sets height to 19px. |
| 108 | For elements matching .primary-button:hover:not(:disabled): Sets background to var(--teal-dark); Sets border color to var(--teal-dark); Sets shadow to 0 3px 7px #163f3e20. |
| 109 | For elements matching .primary-button:disabled: Sets background to #5d7b72; Sets border color to #5d7b72. |
| 110 | For elements matching .submit-help: Sets outer spacing to 10px 0 0; Sets text alignment to center; Sets text size to 10px; Sets text/foreground color to var(--muted). |
| 111 | For elements matching .sidebar: Sets positioning mode to sticky; Sets top offset to 24px; Sets layout/display mode to grid; Sets spacing between layout items to 20px. |
| 112 | For elements matching .status-card: Sets inner spacing to 24px; Sets corner rounding to var(--radius); Sets text/foreground color to #fff; Sets background to #183b43. |
| 113 | For elements matching .status-card-top: Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets main-axis distribution to space-between; Sets spacing between layout items to 10px. |
| 114 | For elements matching .status-card .eyebrow: Sets text size to 9px; Sets character spacing to 1.6px; Sets text/foreground color to #bed1cb. |
| 115 | For elements matching .status-badge: Sets inner spacing to 3px 9px; Sets corner rounding to 20px; Sets background to #34555b; Sets text/foreground color to #dceae5; Sets text size to 10px; Sets whitespace wrapping to nowrap. |
| 116 | For elements matching .status-card h2: Sets outer spacing to 23px 0 12px; Sets text size to 25px; Sets line spacing to 1.3; Sets character spacing to -0.6px; Sets font weight to 500. |
| 117 | For elements matching #status-message: Sets outer spacing to 0; Sets text size to 12px; Sets line spacing to 1.75; Sets text/foreground color to #c8d8d4; Sets long-word wrapping to anywhere. |
| 118 | For elements matching .workflow-list: Sets list marker style to none; Sets inner spacing to 25px 0 0; Sets outer spacing to 24px 0 0; Sets top border to 1px solid #496269. |
| 119 | For elements matching .workflow-list li: Sets positioning mode to relative; Sets layout/display mode to flex; Sets cross-axis alignment to flex-start; Sets spacing between layout items to 13px; Sets bottom inner spacing to 25px. |
| 120 | For elements matching .workflow-list li::after: Sets generated pseudo-element content to ""; Sets positioning mode to absolute; Sets left offset to 13px; Sets top offset to 32px; Sets bottom offset to 5px; Sets width to 1px; Sets background to #496269. |
| 121 | For elements matching .workflow-list li:last-child: Sets bottom inner spacing to 0. |
| 122 | For elements matching .workflow-list li:last-child::after: Sets layout/display mode to none. |
| 123 | For elements matching .workflow-marker: Sets flex shrinking factor to 0; Sets layout/display mode to grid; Sets grid alignment in both axes to center; Sets width to 27px; Sets height to 27px; Sets border to 1px solid #829c9c; Sets corner rounding to 50%; Sets text/foreground color to #d3e1dc; Sets text size to 10px. |
| 124 | For elements matching .workflow-list strong: Sets layout/display mode to block; Sets outer spacing to 3px 0 5px; Sets text size to 12px; Sets font weight to 500; Sets text/foreground color to #eff5f3. |
| 125 | For elements matching .workflow-list p: Sets outer spacing to 0; Sets text/foreground color to #bdcfca; Sets text size to 11px; Sets line spacing to 1.7. |
| 126 | For elements matching .workflow-list li[data-state="active"] .workflow-marker: Sets text/foreground color to #163b43; Sets background to #dae9cf; Sets border color to #dae9cf; Sets shadow to 0 0 0 4px #dae9cf15. |
| 127 | For elements matching .workflow-list li[data-state="complete"] .workflow-marker: Sets background to #395f60; Sets border color to #72938c; Sets text/foreground color to #e4efda. |
| 128 | For elements matching .status-card[data-status="awaiting_review"] .status-badge, .status-card[data-status="user_submitted"] .status-badge, .status-card[data-status="browser_closed"] .status-badge: Sets text/foreground color to #183b43; Sets background to #dcebcf. |
| 129 | For elements matching .status-card[data-status="failed"] .status-badge: Sets text/foreground color to #4e2420; Sets background to #f6d9d0. |
| 130 | For elements matching .review-notice: Sets inner spacing to 13px; Sets top outer spacing to 23px; Sets corner rounding to 7px; Sets text/foreground color to #183b43; Sets background to #e0eccf; Sets text size to 11px; Sets line spacing to 1.7. |
| 131 | For elements matching .review-notice p: Sets outer spacing to 5px 0 0. |
| 132 | For elements matching .job-warnings: Sets top border to 1px solid #6e7770; Sets top inner spacing to 17px; Sets top outer spacing to 20px; Sets text/foreground color to #fff0cd; Sets text size to 11px; Sets line spacing to 1.7. |
| 133 | For elements matching .job-warnings ul: Sets left inner spacing to 16px; Sets outer spacing to 8px 0 0. |
| 134 | For elements matching .job-warnings li + li: Sets top outer spacing to 6px. |
| 135 | For elements matching .connection-message: Sets text size to 11px; Sets line spacing to 1.6; Sets text/foreground color to #ffe5be; Sets outer spacing to 18px 0 0. |
| 136 | For elements matching .secondary-button: Sets width to 100%; Sets top outer spacing to 14px; Sets inner spacing to 9px 12px; Sets border to 1px solid #9cbbb3; Sets corner rounding to 6px; Sets text/foreground color to #fff; Sets background to transparent; Sets text size to 12px. |
| 137 | For elements matching .secondary-button:hover: Sets background to #34555b. |
| 138 | For elements matching .review-card: Sets positioning mode to relative; Sets inner spacing to 23px; Sets border to 1px solid #dce4d7; Sets corner rounding to var(--radius); Sets background to #edf1e6. |
| 139 | For elements matching .review-icon: Sets layout/display mode to grid; Sets grid alignment in both axes to center; Sets width to 33px; Sets height to 33px; Sets bottom outer spacing to 12px; Sets corner rounding to 9px; Sets text/foreground color to var(--teal); Sets background to #dfe9d5. |
| 140 | For elements matching .review-icon svg: Sets width to 23px; Sets height to 23px. |
| 141 | For elements matching .review-card h3: Sets outer spacing to 0 0 8px; Sets text size to 15px; Sets font weight to 600; Sets character spacing to -0.2px. |
| 142 | For elements matching .review-card &gt; p: Sets outer spacing to 0; Sets text/foreground color to #4a655f; Sets text size to 12px; Sets line spacing to 1.8. |
| 143 | For elements matching .review-card-note: Sets top outer spacing to 17px; Sets top inner spacing to 15px; Sets top border to 1px solid #d1dccb; Sets text size to 11px; Sets line spacing to 1.8; Sets text/foreground color to #52675d. |
| 144 | For elements matching .sidebar-footnote: Sets outer spacing to -1px 8px 0; Sets text size to 10px; Sets line spacing to 1.8; Sets text alignment to center; Sets text/foreground color to var(--muted). |
| 145 | For elements matching .page-footer: Sets layout/display mode to flex; Sets main-axis distribution to space-between; Sets spacing between layout items to 20px; Sets inner spacing to 29px 1px 35px; Sets text/foreground color to #6b7772; Sets text size to 10px. |
| 146 | For elements matching .page-footer &gt; span:first-child: Sets font weight to 600. |
| 147 | For elements matching .form-error, .noscript-message: Sets outer spacing to 22px 32px 0; Sets inner spacing to 15px; Sets border to 1px solid #e8c1b9; Sets corner rounding to 8px; Sets background to #fff4ef; Sets text/foreground color to #7e352b; Sets text size to 12px; Sets long-word wrapping to anywhere. |
| 148 | For elements matching .form-error p: Sets outer spacing to 5px 0 0. |
| 149 | For elements matching .form-error ul: Sets left inner spacing to 17px; Sets outer spacing to 8px 0 0. |
| 150 | For elements matching .form-error li + li: Sets top outer spacing to 4px. |
| 151 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 152 | Begins responsive/accessibility rules restricted to (min-width: 1500px). |
| 153 | For elements matching .page-intro within @media (min-width: 1500px): Sets top inner spacing to 59px; Sets bottom inner spacing to 44px. |
| 154 | Ends the @media (min-width: 1500px) rule group. |
| 155 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 156 | Begins responsive/accessibility rules restricted to (max-width: 1050px). |
| 157 | For elements matching .header-inner, .page-shell within @media (max-width: 1050px): Sets width to calc(100% - 48px). |
| 158 | For elements matching .workspace-grid within @media (max-width: 1050px): Sets grid column sizes to minmax(0, 1fr) 290px; Sets spacing between layout items to 22px. |
| 159 | For elements matching .card-heading, .form-footer within @media (max-width: 1050px): Sets left inner spacing to 25px; Sets right inner spacing to 25px. |
| 160 | For elements matching .form-fields within @media (max-width: 1050px): Sets inner spacing to 0 25px. |
| 161 | For elements matching .status-card within @media (max-width: 1050px): Sets inner spacing to 22px. |
| 162 | For elements matching .branch-tag within @media (max-width: 1050px): Sets maximum width to 235px. |
| 163 | For elements matching .document-grid within @media (max-width: 1050px): Sets spacing between layout items to 12px. |
| 164 | For elements matching .document-field within @media (max-width: 1050px): Sets inner spacing to 14px. |
| 165 | Ends the @media (max-width: 1050px) rule group. |
| 166 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 167 | Begins responsive/accessibility rules restricted to (max-width: 820px). |
| 168 | For elements matching .page-intro within @media (max-width: 820px): Sets cross-axis alignment to flex-start; Sets flex layout direction to column; Sets spacing between layout items to 12px; Sets top inner spacing to 33px; Sets bottom inner spacing to 25px. |
| 169 | For elements matching .branch-tag within @media (max-width: 820px): Sets maximum width to none; Sets top inner spacing to 5px. |
| 170 | For elements matching .branch-tag &gt; svg within @media (max-width: 820px): Sets width to 21px; Sets height to 21px. |
| 171 | For elements matching .branch-tag div within @media (max-width: 820px): Sets layout/display mode to flex; Sets cross-axis alignment to center; Sets spacing between layout items to 9px. |
| 172 | For elements matching .branch-tag span within @media (max-width: 820px): Sets bottom outer spacing to 0. |
| 173 | For elements matching .workspace-grid within @media (max-width: 820px): Sets grid column sizes to minmax(0, 1fr) 255px; Sets spacing between layout items to 18px. |
| 174 | For elements matching .field-grid, .document-grid within @media (max-width: 820px): Sets grid column sizes to minmax(0, 1fr); Sets spacing between layout items to 18px. |
| 175 | For elements matching .card-heading, .form-footer within @media (max-width: 820px): Sets left inner spacing to 22px; Sets right inner spacing to 22px. |
| 176 | For elements matching .form-fields within @media (max-width: 820px): Sets inner spacing to 0 22px. |
| 177 | For elements matching .document-description within @media (max-width: 820px): Sets minimum height to 0. |
| 178 | For elements matching .status-card within @media (max-width: 820px): Sets inner spacing to 20px. |
| 179 | For elements matching .status-card h2 within @media (max-width: 820px): Sets text size to 22px. |
| 180 | For elements matching .status-card-top within @media (max-width: 820px): Sets flex item wrapping to wrap. |
| 181 | For elements matching .review-card within @media (max-width: 820px): Sets inner spacing to 20px. |
| 182 | For elements matching .form-error, .noscript-message within @media (max-width: 820px): Sets left outer spacing to 22px; Sets right outer spacing to 22px. |
| 183 | Ends the @media (max-width: 820px) rule group. |
| 184 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 185 | Begins responsive/accessibility rules restricted to (max-width: 640px). |
| 186 | For elements matching .header-inner, .page-shell within @media (max-width: 640px): Sets width to calc(100% - 32px). |
| 187 | For elements matching .header-inner within @media (max-width: 640px): Sets height to 72px; Sets spacing between layout items to 12px. |
| 188 | For elements matching .brand within @media (max-width: 640px): Sets spacing between layout items to 9px; Sets text size to 20px. |
| 189 | For elements matching .brand-mark within @media (max-width: 640px): Sets width to 36px; Sets height to 36px; Sets corner rounding to 10px. |
| 190 | For elements matching .brand-mark svg within @media (max-width: 640px): Sets width to 26px; Sets height to 26px. |
| 191 | For elements matching .workspace-label within @media (max-width: 640px): Sets inner spacing to 6px 8px; Sets text size to 9px; Sets spacing between layout items to 5px. |
| 192 | For elements matching .small-dot within @media (max-width: 640px): Sets width to 5px; Sets height to 5px. |
| 193 | For elements matching .page-intro within @media (max-width: 640px): Sets top inner spacing to 29px. |
| 194 | For elements matching .eyebrow within @media (max-width: 640px): Sets text size to 9px; Sets character spacing to 1.4px. |
| 195 | For elements matching h1 within @media (max-width: 640px): Sets text size to 37px; Sets character spacing to -1.7px. |
| 196 | For elements matching .intro-copy within @media (max-width: 640px): Sets text size to 13px. |
| 197 | For elements matching .branch-tag within @media (max-width: 640px): Sets spacing between layout items to 8px. |
| 198 | For elements matching .branch-tag strong within @media (max-width: 640px): Sets text size to 9px. |
| 199 | For elements matching .branch-tag span within @media (max-width: 640px): Sets text size to 8px; Sets character spacing to 1px. |
| 200 | For elements matching .workspace-grid within @media (max-width: 640px): Sets grid column sizes to minmax(0, 1fr); Sets spacing between layout items to 24px. |
| 201 | For elements matching .sidebar within @media (max-width: 640px): Sets positioning mode to static. |
| 202 | For elements matching .status-card within @media (max-width: 640px): Sets inner spacing to 24px; Sets scroll target top spacing to 18px. |
| 203 | For elements matching .status-card h2 within @media (max-width: 640px): Sets text size to 25px. |
| 204 | For elements matching .status-card h2 br within @media (max-width: 640px): Sets layout/display mode to none. |
| 205 | For elements matching .card-heading within @media (max-width: 640px): Sets inner spacing to 22px. |
| 206 | For elements matching .card-heading h2 within @media (max-width: 640px): Sets text size to 18px. |
| 207 | For elements matching .form-section within @media (max-width: 640px): Sets top inner spacing to 26px; Sets bottom inner spacing to 27px. |
| 208 | For elements matching .section-heading within @media (max-width: 640px): Sets spacing between layout items to 10px. |
| 209 | For elements matching .section-heading h3 within @media (max-width: 640px): Sets text size to 15px. |
| 210 | For elements matching .field input, .field select within @media (max-width: 640px): Sets text size to 16px. |
| 211 | For elements matching .form-footer &gt; p:first-child within @media (max-width: 640px): Sets cross-axis alignment to flex-start; Sets text size to 10px; Sets line spacing to 1.6. |
| 212 | For elements matching .document-grid within @media (max-width: 640px): Sets spacing between layout items to 13px. |
| 213 | For elements matching .document-field within @media (max-width: 640px): Sets inner spacing to 17px. |
| 214 | For elements matching .document-description within @media (max-width: 640px): Sets bottom outer spacing to 13px. |
| 215 | For elements matching input[type="file"] within @media (max-width: 640px): Sets text size to 11px. |
| 216 | For elements matching input[type="file"]::file-selector-button within @media (max-width: 640px): Sets text size to 11px; Sets inner spacing to 8px 11px. |
| 217 | For elements matching .page-footer within @media (max-width: 640px): Sets text size to 9px; Sets top inner spacing to 25px. |
| 218 | Ends the @media (max-width: 640px) rule group. |
| 219 | Blank line separating the surrounding declarations, statements, or document blocks. |
| 220 | Begins responsive/accessibility rules restricted to (prefers-reduced-motion: reduce). |
| 221 | For elements matching *, *::before, *::after within @media (prefers-reduced-motion: reduce): Sets scroll-behavior to auto !important; Sets animated property transitions to none !important. |
| 222 | Ends the @media (prefers-reduced-motion: reduce) rule group. |
