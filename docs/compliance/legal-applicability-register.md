# Country-wise legal applicability and compliance register

The product is a business-to-business software service (a customer company signs up, its people use it). It takes payment through Razorpay's
hosted checkout, runs AI features at the customer's request, and lets each customer put its own website, portal and apps under its own brand.
Applicability below is the engineering assessment from that shape; **counsel confirms each row** (the requirements document says the same).

Columns: **Applies** = Yes / Likely / Conditional (depends on a fact stated) / No. **Where it is met** points to the page or code. **Owner** items need a decision or action outside the code.

## United Kingdom

| Law | Applies | What it needs from us | Where it is met | Owner |
| --- | --- | --- | --- | --- |
| UK GDPR | Yes, for UK customers and their people (as processor) and for UK visitors and sign-ups (as controller) | Lawful basis, transparency, rights, security, processor terms, transfers, breach notice | `/privacy` (bases, rights, transfers, retention), `/dpa`, `/data-requests`, `/subprocessors`, security controls in [gap-assessment.md](./gap-assessment.md) | UK representative if the entity has no UK presence and the Article 27 test is met; ICO registration/fee if applicable |
| Data Protection Act 2018 | Yes | Complements UK GDPR; complaints route to the ICO | Same pages; ICO named on `/data-requests` | |
| PECR | Conditional: cookies and electronic marketing | Consent before non-essential cookies; opt-out on marketing emails | Consent banner on companies' websites (`SiteConsent`), the platform's own site sets no analytics or advertising cookies (`/cookies`); web-push topics with opt-out | Marketing emails: include an unsubscribe link if ever sent |
| Consumer Rights Act 2015, Consumer Contracts Regulations 2013 | Conditional: only if sold to consumers | The service is for businesses (Terms: "Who may use the service") | `/terms`, `/refund-policy` | Counsel to confirm business-only sales so consumer cancellation rights do not apply |
| Companies Act 2006 | Conditional: if a UK company operates the service | Registered name, number, address on the website | | Add the entity details to the footer and Terms |
| UK VAT | Conditional: on UK sales above the threshold | Registration, invoices | Invoices exist (`lib/platform/billing/invoices.ts`); the tax configuration is per platform settings | Register where required |

## United Arab Emirates

| Law | Applies | What it needs | Where it is met | Owner |
| --- | --- | --- | --- | --- |
| PDPL, Federal Decree-Law 45 of 2021 | Likely, for UAE customers and visitors | Notice, consent/other basis, rights, security, breach notice, transfer conditions | `/privacy`, `/dpa`, `/data-requests`, `/subprocessors` | Executive Regulations and the UAE Data Office's guidance to be checked as they are issued |
| DIFC Data Protection Law, ADGM Regulations | Conditional: customers established in those zones | Similar duties, plus registration and local rules | The same documents; transfers per `/subprocessors` | Identify any DIFC/ADGM customers |
| Consumer Protection Law | Conditional: consumer-facing activity | | Business-only service | Counsel to confirm |
| Electronic Transactions and Trust Services Law | Likely | Valid electronic contracts, records | Terms accepted online; audit logs; e-signature features belong to the customers' own use | |
| UAE VAT | Conditional: taxable supplies | | Invoices | Register if thresholds are met |
| Cybersecurity / sector rules | Conditional: customer's sector | | Security controls; customers in regulated sectors may need residency or audit rights | Ask enterprise customers for sector requirements |

## India

| Law | Applies | What it needs | Where it is met | Owner |
| --- | --- | --- | --- | --- |
| Digital Personal Data Protection Act, 2023 and Rules, 2025 | Yes (the operator is in India; customers' people are in India) | Notice and consent, purpose limits, rights, grievance redressal, security safeguards, breach intimation to the Board and people, deletion when purpose ends, children's data limits | `/privacy` (controller, grievance contact, retention, children), `/data-requests` (India rights, Board), `/dpa`, consent banner, deletion lifecycle | Commencement dates of each provision; a Data Protection Officer and audits if designated a Significant Data Fiduciary; verifiable parental consent only if children are ever served (the service is not for them) |
| IT Act, 2000 | Yes | Reasonable security practices; electronic records | Security controls; audit logs | |
| IT Rules, 2021 | Conditional: intermediary duties if user content is published | Grievance officer, takedown process | Customers publish their own websites; terms prohibit unlawful use (`/terms`) | Counsel to confirm whether the platform is an intermediary for customers' websites; if so publish a grievance officer and takedown process |
| CERT-In Directions, 2022 | Yes for the operator | Report cyber incidents within 6 hours; keep logs 180 days; synchronise clocks | Incident procedure ([policies/incident-response.md](./policies/incident-response.md)); sign-in and security events kept 180 days; host clocks are managed by the cloud provider | **Owner:** ship application and access logs to a 180-day store; name a point of contact registered with CERT-In |
| Consumer Protection Act, 2019 | Conditional: consumer-facing | | Business-only service | Counsel to confirm |
| Consumer Protection (E-Commerce) Rules, 2020 | No, unless the platform becomes a marketplace | | | |
| GST | Yes | Registered, tax invoices with GSTIN | Invoicing and GST handling in `lib/platform/billing/gst.ts`, `invoices.ts` | File returns; keep records for the statutory period |

## United States

| Law | Applies | What it needs | Where it is met | Owner |
| --- | --- | --- | --- | --- |
| FTC Act (unfair or deceptive practices) | Yes | Claims must be true | Site copy describes only what is built; no invented stories, discounts or certifications (`/success-stories`, `/security`) | Keep it that way: no SOC 2 / ISO claim until certified |
| State privacy laws (CCPA/CPRA and others) | Conditional: thresholds | Notice, rights, no sale/sharing without opt-out, contracts with service providers | `/privacy` (no sale or sharing), `/data-requests` (California rights), `/dpa` (service-provider terms) | Check revenue and volume thresholds each year |
| State breach notification laws | Yes if US residents' data is affected | Notify affected people and regulators | [policies/incident-response.md](./policies/incident-response.md) | |
| CAN-SPAM | Conditional: commercial email | Opt-out, sender identity, postal address | The platform sends transactional email only; customers' own campaigns are their responsibility | Add an unsubscribe and address if marketing email is ever sent |
| TCPA | Conditional: SMS and calls | Consent | Messaging features use the customer's own accounts and consent | Customer terms put the duty on the customer (`/terms`) |
| COPPA | No: not directed at children | | `/terms`, `/privacy` (Children) | |
| GLBA / Safeguards Rule, HIPAA | Conditional: only if a customer is a covered entity | BAA, extra safeguards | Not offered as a HIPAA-covered service | Do not market for PHI without a BAA programme |
| PCI DSS | Conditional | Card data never touches our systems (hosted checkout) | Razorpay hosted checkout; no card fields in the code | Complete the SAQ A each year |
| State sales tax | Conditional: nexus | | | Review with the tax adviser |

## Kingdom of Saudi Arabia

| Law | Applies | What it needs | Where it is met | Owner |
| --- | --- | --- | --- | --- |
| Personal Data Protection Law, Implementing Regulations | Likely for Saudi customers and visitors | Notice, consent, rights, security, breach notice to SDAIA, records | `/privacy`, `/dpa`, `/data-requests` (Saudi rights, SDAIA) | Registration or controller obligations to be checked by counsel |
| Regulation on Personal Data Transfer Outside the Kingdom | Likely | Transfers need a lawful ground and safeguards | `/subprocessors`, [policies/international-transfer-register.md](./policies/international-transfer-register.md) | Confirm the ground for each transfer; consider residency for government customers |
| E-Commerce Law, Electronic Transactions Law | Conditional | | Terms accepted online | |
| Anti-Cyber Crime Law | Yes | | Security controls; incident handling | |
| VAT | Conditional | | Invoices | Register if thresholds are met |
| NCA controls | Conditional: regulated or government customers | | Security controls mapped in [standards-mapping.md](./standards-mapping.md) | Ask customers for their NCA requirements |
| CST regulations | No, unless regulated telecom services are provided | | | |
