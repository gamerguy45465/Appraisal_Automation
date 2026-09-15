# Line explanations: README.md

Source: [README.md](../../README.md). Numbers refer to the original file before comments were added.

The original file was unchanged during annotation. Later login-entry and PostLogon updates explain the current root entry, authentication redirect guard, restart instructions and verification status. The table below describes the historical annotation snapshot.

| Original line | Explanation |
| ---: | --- |
| 1 | Introduce the "Appraisal Automation" section of this document. |
| 2 | Blank line separating adjacent document blocks. |
| 3 | Document this statement under "Appraisal Automation": A Windows desktop workflow that reads a URLA and optional sales contract, then prepares an R3 AMC appraisal order in a visible Chromium window. |
| 4 | Blank line separating adjacent document blocks. |
| 5 | Document this statement under "Appraisal Automation": The application uses an HTML/CSS/JavaScript frontend, Express and TypeScript, LangChain for JavaScript, OpenAI Responses, Anthropic Messages, Google Gemini, or SpaceXAI (Grok), and Playwright's TypeScript API. |
| 6 | Blank line separating adjacent document blocks. |
| 7 | Provide the table columns/row under "Appraisal Automation": Provider; Default model when blank. |
| 8 | Separate the table header from its rows and specify Markdown column alignment. |
| 9 | Provide the table columns/row under "Appraisal Automation": OpenAI (initial selection); `gpt-5.6-sol`. |
| 10 | Provide the table columns/row under "Appraisal Automation": Anthropic; `claude-opus-5`. |
| 11 | Provide the table columns/row under "Appraisal Automation": Google Gemini; `gemini-3.8-flash`. |
| 12 | Provide the table columns/row under "Appraisal Automation": SpaceXAI; `grok-4.6`. |
| 13 | Blank line separating adjacent document blocks. |
| 14 | Introduce the "Run on Windows" section of this document. |
| 15 | Blank line separating adjacent document blocks. |
| 16 | Document this statement under "Run on Windows": Install Node.js 24 or newer with npm and ensure Windows PowerShell is available. |
| 17 | Blank line separating adjacent document blocks. |
| 18 | Open a literal code/command example labeled powershell. |
| 19 | Show this literal command, path, or recorded diagnostic step in the documentation: npm install. |
| 20 | Show this literal command, path, or recorded diagnostic step in the documentation: npx playwright install chromium. |
| 21 | Show this literal command, path, or recorded diagnostic step in the documentation: npm run build. |
| 22 | Show this literal command, path, or recorded diagnostic step in the documentation: npm start. |
| 23 | Close the preceding literal code/command example. |
| 24 | Blank line separating adjacent document blocks. |
| 25 | Document this statement under "Run on Windows": Open the loopback address printed by the server. |
| 26 | Blank line separating adjacent document blocks. |
| 27 | Document this statement under "Run on Windows": Choose your AI provider, optionally enter its model ID immediately below, and supply that provider's API key. |
| 28 | Blank line separating adjacent document blocks. |
| 29 | Document this statement under "Run on Windows": For Google Gemini, supply a Gemini API key from Google AI Studio. |
| 30 | Blank line separating adjacent document blocks. |
| 31 | Document this statement under "Run on Windows": For Grok, select **SpaceXAI** and enter the **Grok API key** from the xAI Console. |
| 32 | Blank line separating adjacent document blocks. |
| 33 | Document this statement under "Run on Windows": The loan number must match 685-20xxxxx, where every x is a digit, for example 685-2012345. |
| 34 | Blank line separating adjacent document blocks. |
| 35 | Document this statement under "Run on Windows": Submitting the local form starts the preparation job. |
| 36 | Blank line separating adjacent document blocks. |
| 37 | Document this statement under "Run on Windows": R3 usernames and passwords are not collected by the local form, stored in the worker environment, or provided to the model. |
| 38 | Blank line separating adjacent document blocks. |
| 39 | Document this statement under "Run on Windows": When the application hands over the R3 form, inspect every populated value and resolve any reported uncertainty. |
| 40 | Blank line separating adjacent document blocks. |
| 41 | Document this statement under "Run on Windows": If preparation times out or encounters a problem after opening the order form, the app stops automation and hands the partial form to you with an explicit incomplete-preparation message and review warnings. |
| 42 | Blank line separating adjacent document blocks. |
| 43 | Introduce the "Sample documents" section of this document. |
| 44 | Blank line separating adjacent document blocks. |
| 45 | Document this statement under "Sample documents": For a fictional purchase example, use Example_Pdfs/Sample_Form_1003_URLA.pdf as the URLA and Example_Pdfs/Sample_Nevada_Purchase_Contract.pdf as the sales contract. |
| 46 | Blank line separating adjacent document blocks. |
| 47 | Document this statement under "Sample documents": The generated contract is also available at output/pdf/Sample_Nevada_Purchase_Contract_With_Agents.pdf. |
| 48 | Blank line separating adjacent document blocks. |
| 49 | Document this statement under "Sample documents": The sample purchase price is **$485,000.00**, recorded in the page 1 purchase-price form field and page 9's Exhibit A. |
| 50 | Blank line separating adjacent document blocks. |
| 51 | Document this statement under "Sample documents": The separate four-page samples SAMPLE_URLA_1003_FHA_Whitmore.pdf and SAMPLE_Nevada_Residential_Purchase_Agreement.pdf establish FHA financing, primary-residence occupancy, and one unit (URLA pages 1–2), plus a site-built residence (agreement page 3). |
| 52 | Blank line separating adjacent document blocks. |
| 53 | Introduce the "Business rules" section of this document. |
| 54 | Blank line separating adjacent document blocks. |
| 55 | Record this item under "Business rules": URLA loans identified as VA are rejected with instructions to use the VA portal. |
| 56 | Record this item under "Business rules": FHA and FHA Zero Down loans require the separately entered FHA case number. |
| 57 | Record this item under "Business rules": The supported URLA loan-program classification sets R3 Loan Type: Conventional or FHA, including FHA Zero Down. |
| 58 | Record this item under "Business rules": Branch is GUILD 685 SUMMERLIN ONE. |
| 59 | Record this item under "Business rules": Sale price is populated only for a purchase with a supplied sales contract. |
| 60 | Record this item under "Business rules": Purchase access contact uses the listing agent when supported by the documents, with borrower access unchecked. |
| 61 | Record this item under "Business rules": Borrower and required access contacts need first and last names plus at least one supported phone number or email. |
| 62 | Record this item under "Business rules": Missing required borrower/access names explicitly clear any stale field values and remain flagged as missing. |
| 63 | Record this item under "Business rules": Listing agent and seller's agent mean the same seller-representative role; Buyer's Agent is separate. |
| 64 | Record this item under "Business rules": Status contact is Amber Coleman Team, email ambercolemanteam@guildmortgage.net. |
| 65 | Record this item under "Business rules": Always fill the loan officer's first name Amber, last name Coleman, work phone 702-604-7027, and email acoleman@guildmortgage.net. |
| 66 | Record this item under "Business rules": If an existing mapped phone field does not retain its approved value after filling and leaving the field, preparation may retry equivalent US formats, then use private guarded digit entry. |
| 67 | Record this item under "Business rules": APN, agency case IDs, lockbox, access instructions, inspection preference, and special handling stay blank; county remains Unknown and Side-by-Side stays unchecked. |
| 68 | Record this item under "Business rules": Product means the appraisal service/form, not mortgage financing. |
| 69 | Record this item under "Business rules": When no product is supplied, the existing server baseline uses the inspected property/program pairs below. |
| 70 | Record this item under "Business rules": Missing borrower, contact, loan-purpose, and property facts remain unknown or are reported for review. |
| 71 | Blank line separating adjacent document blocks. |
| 72 | Document this statement under "Business rules": The server baseline uses documented property type and loan program; the recommendation path uses the same inspected product families and must match the loan program. |
| 73 | Blank line separating adjacent document blocks. |
| 74 | Provide the table columns/row under "Business rules": Property type; Conventional; FHA. |
| 75 | Separate the table header from its rows and specify Markdown column alignment. |
| 76 | Provide the table columns/row under "Business rules": Single Family; `1004 SFR CONV`; `1004 SFR - FHA`. |
| 77 | Provide the table columns/row under "Business rules": Condominium; `1073 CONDO CONV`; `1073 CONDO FHA`. |
| 78 | Provide the table columns/row under "Business rules": Manufactured Home; `1004C MANU CONV`; `1004C Manuf - FHA`. |
| 79 | Provide the table columns/row under "Business rules": Two To Four Family; `1025 Multi-Family CONV`; `1025 Multi - FHA`. |
| 80 | Blank line separating adjacent document blocks. |
| 81 | Document this statement under "Business rules": These are the R3 option labels observed during the authenticated read-only inspection and maintained in src/browser/r3-fields.ts. |
| 82 | Blank line separating adjacent document blocks. |
| 83 | Introduce the "Architecture and data lifetime" section of this document. |
| 84 | Blank line separating adjacent document blocks. |
| 85 | Document this statement under "Architecture and data lifetime": The local server validates the form and PDF upload, authenticates requests with an in-memory session and CSRF protection, and permits one active job. |
| 86 | Blank line separating adjacent document blocks. |
| 87 | Document this statement under "Architecture and data lifetime": Process scope is intentional: the selected API key uses the generic APPRAISAL_AI_API_KEY worker variable, with local loan settings, without being saved to the Windows User or Machine registry scopes. |
| 88 | Blank line separating adjacent document blocks. |
| 89 | Document this statement under "Architecture and data lifetime": The worker delegates to runPreparation in src/preparation.ts, which extracts structured facts from the PDFs, applies deterministic business validation, waits for manual R3 sign-in, and prepares the form at https://clients.r3amc.com/Orders/Create. |
| 90 | Blank line separating adjacent document blocks. |
| 91 | Document this statement under "Architecture and data lifetime": Both preparation watchdogs retain their processing budgets and pause during manual sign-in. |
| 92 | Blank line separating adjacent document blocks. |
| 93 | Document this statement under "Architecture and data lifetime": Existing R3 fields retain their exact-ID mapping. |
| 94 | Blank line separating adjacent document blocks. |
| 95 | Document this statement under "Architecture and data lifetime": Phone recovery covers exactly 19 existing mapped phone keys: work/home/mobile fields for borrower, co-borrower, access contact, listing agent, buyer agent, and status contact, plus loan-officer work phone only. |
| 96 | Blank line separating adjacent document blocks. |
| 97 | Document this statement under "Architecture and data lifetime": Each client receives the selected key explicitly and uses a pinned official endpoint: https://api.openai.com/v1, https://api.anthropic.com, https://generativelanguage.googleapis.com, or https://api.x.ai/v1. |
| 98 | Blank line separating adjacent document blocks. |
| 99 | Document this statement under "Architecture and data lifetime": Google uses @langchain/google 0.2.5 ChatGoogle through src/google.ts, with platformType: 'gai' and an API-key-only apiClient. |
| 100 | Blank line separating adjacent document blocks. |
| 101 | Document this statement under "Architecture and data lifetime": Grok uses @langchain/xai 1.4.12 ChatXAI through src/xai.ts. |
| 102 | Blank line separating adjacent document blocks. |
| 103 | Document this statement under "Architecture and data lifetime": [xAI's documented file attachment paths](https://docs.x.ai/developers/model-capabilities/files/chat-with-files) use uploaded file IDs or public URLs. |
| 104 | Blank line separating adjacent document blocks. |
| 105 | Introduce the "Model and integration status" section of this document. |
| 106 | Blank line separating adjacent document blocks. |
| 107 | Document this statement under "Model and integration status": Defaults are OpenAI [gpt-5.6-sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol), Anthropic [claude-opus-5](https://platform.claude.com/docs/en/models/opus-5/overview), Google gemini-3.8-flash, and SpaceXAI grok-4.6. |
| 108 | Blank line separating adjacent document blocks. |
| 109 | Document this statement under "Model and integration status": Extraction first requests native JSON schema output. |
| 110 | Blank line separating adjacent document blocks. |
| 111 | Document this statement under "Model and integration status": Only an explicit HTTP 400 rejection of the native output format permits a retry using functionCalling with the same provider, model, key, and outbound schema; local Zod parsing always validates the result. |
| 112 | Blank line separating adjacent document blocks. |
| 113 | Document this statement under "Model and integration status": The authenticated R3 create-order page and its inline scripts were inspected read-only during development, including field names and dependent lookup routes. |
| 114 | Blank line separating adjacent document blocks. |
| 115 | Document this statement under "Model and integration status": The implementation should therefore be treated as locally verified software awaiting live integration acceptance, not a certified production deployment. |
| 116 | Blank line separating adjacent document blocks. |
| 117 | Introduce the "Maintenance" section of this document. |
| 118 | Blank line separating adjacent document blocks. |
| 119 | Document this statement under "Maintenance": Run npm run check for TypeScript checking, unit/integration tests, Playwright browser tests, and a production build. |
| 120 | Blank line separating adjacent document blocks. |
| 121 | Document this statement under "Maintenance": Development verification on September 8, 2026: npm run check passed TypeScript checking, all 28 unit/integration tests, all 17 browser tests, and the production build. |
| 122 | Blank line separating adjacent document blocks. |
| 123 | Document this statement under "Maintenance": Manual sign-in verification on September 9, 2026: npm run check passed TypeScript checking, all 34 unit/integration tests, all 24 browser tests, and the production build. |
| 124 | Blank line separating adjacent document blocks. |
| 125 | Document this statement under "Maintenance": A subsequent user-assisted login diagnostic on September 9 confirmed that R3 redirects POST /Login.aspx through GET /Account/PostLogin to /Orders/Search. |
| 126 | Blank line separating adjacent document blocks. |
| 127 | Document this statement under "Maintenance": The subsequent dropdown and incomplete-review changes address missing Loan Type/Property Type selections and premature browser closure. |
| 128 | Blank line separating adjacent document blocks. |
| 129 | Document this statement under "Maintenance": The later contact changes add explicit refinance access filling and separate listing/buyer agent extraction and mapping. |
| 130 | Blank line separating adjacent document blocks. |
| 131 | Document this statement under "Maintenance": The seller's-agent wording and fictional sample-contract update passed historical npm run check: TypeScript checking, 97 unit/integration tests across 7 files, 44 browser tests, and the production build, for 141 passing tests. |
| 132 | Blank line separating adjacent document blocks. |
| 133 | Document this statement under "Maintenance": The sale-price fix shares SALE_PRICE_INSTRUCTIONS between extraction and preparation and clarifies the schema description. |
| 134 | Blank line separating adjacent document blocks. |
| 135 | Document this statement under "Maintenance": The provider-selection update adds @langchain/anthropic 1.5.9; its dependency audit reported zero known vulnerabilities. |
| 136 | Blank line separating adjacent document blocks. |
| 137 | Document this statement under "Maintenance": The subsequent Anthropic 400/422 investigation confirmed that the previous outbound schema exceeded the documented union limit. |
| 138 | Blank line separating adjacent document blocks. |
| 139 | Document this statement under "Maintenance": The fixed loan-officer update changes the approved plan and bounded field mapping, without changing extraction schemas or the human submission workflow. |
| 140 | Blank line separating adjacent document blocks. |
| 141 | Document this statement under "Maintenance": The initial Work Phone recovery was limited to loanOfficer.workPhone. |
| 142 | Blank line separating adjacent document blocks. |
| 143 | Document this statement under "Maintenance": For the subsequent expansion to all existing mapped phone fields, historical npm run check passed with exit code 0: TypeScript checking, 176 unit/integration tests across 11 files, all 60 Playwright tests, and the production build (236 tests total). |
| 144 | Blank line separating adjacent document blocks. |
| 145 | Document this statement under "Maintenance": The product update uses shared APPRAISAL_PRODUCT_INSTRUCTIONS and the existing evidence array: explicit requests cite field product; recommendations cite productRecommendation. |
| 146 | Blank line separating adjacent document blocks. |
| 147 | Document this statement under "Maintenance": The Google Gemini update adds @langchain/google 0.2.5; installation's dependency audit reported zero known vulnerabilities. |
| 148 | Blank line separating adjacent document blocks. |
| 149 | Document this statement under "Maintenance": The SpaceXAI update adds @langchain/xai 1.4.12 and local PDF page rendering; installation's dependency audit reported zero known vulnerabilities. |
| 150 | Blank line separating adjacent document blocks. |
| 151 | Document this statement under "Maintenance": After updating, restart the local application and refresh its page. |
| 152 | Blank line separating adjacent document blocks. |
| 153 | Document this statement under "Maintenance": The project-specific maintenance skill is in [skills/appraisal-automation/SKILL.md](skills/appraisal-automation/SKILL.md). |
