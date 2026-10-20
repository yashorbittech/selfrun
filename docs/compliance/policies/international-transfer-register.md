# International transfer register

**Status: template. The owner must fill the region and ground columns from each provider's actual configuration.**

| Provider | Data | Region (to confirm) | Ground (to confirm with counsel) | Safeguards |
| --- | --- | --- | --- | --- |
| MongoDB Atlas | All application data | Cluster region chosen in Atlas | SCCs / UK addendum / adequacy | Encryption in transit and at rest, DPA |
| Vercel | Application traffic | Edge and function region setting | SCCs / UK addendum | DPA |
| Resend | Email address, message | Provider region | SCCs / UK addendum | DPA |
| Razorpay | Payer details for the payment | India | Contract; no card data on our systems | PCI DSS level 1 provider |
| OpenAI | Prompts and outputs sent by users | Provider region | SCCs / contract | DPA, no training on API data per provider terms |
| GitHub | App identity for builds | Provider region | SCCs | DPA |

Rules: UK → UK addendum or adequacy; UAE and KSA → the transfer conditions in the PDPL and the KSA transfer regulation; India → permitted unless a country is restricted by notification; USA → SCCs or provider certification. Review at each new provider and yearly.
