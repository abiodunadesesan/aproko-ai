export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const privacyContent: LegalPageContent = {
  title: 'Privacy Policy',
  lastUpdated: 'August 18, 2026',
  intro:
    'This Privacy Policy explains how Aproko AI ("Aproko", "we", "us") collects, uses, stores, and protects information when you use our web application, browser extension, and related services.',
  sections: [
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      paragraphs: ['We collect information in the following categories:'],
      bullets: [
        'Account information — such as your name, email address, and authentication identifiers provided through our identity provider (Clerk).',
        'Workspace content — documents, notes, transcripts, chat messages, memory items, and study outputs you upload or create in your workspace.',
        'Usage and diagnostics — product interaction events, performance logs, and error reports used to operate and improve the service.',
        'Billing information — subscription status and payment metadata processed by our payment provider when you upgrade a plan. We do not store full payment card numbers on our servers.',
      ],
    },
    {
      id: 'how-we-use-information',
      title: 'How we use information',
      paragraphs: ['We use your information to:'],
      bullets: [
        'Provide core product features including document indexing, retrieval-grounded chat, memory, and study tools.',
        'Authenticate you, enforce workspace isolation, and protect against abuse.',
        'Process subscriptions and communicate service-related updates.',
        'Monitor reliability, debug issues, and improve product quality.',
        'Comply with legal obligations and respond to valid requests.',
      ],
    },
    {
      id: 'ai-processing',
      title: 'AI processing',
      paragraphs: [
        'When you use AI features, relevant workspace content may be sent to configured model providers to generate responses grounded in your materials. We design retrieval flows to minimize unnecessary data exposure and to scope processing to your workspace boundary.',
        'Do not submit sensitive personal data you are not authorized to share, or content that violates applicable law or third-party rights.',
      ],
    },
    {
      id: 'browser-extension',
      title: 'Browser extension (Live Context)',
      paragraphs: [
        'Aproko’s browser extension can capture limited text from the webpage you are currently viewing and use that text to help answer questions. The extension is intended for learning and productivity support.',
      ],
      bullets: [
        'Information we capture: (1) cursor-focused text around what your mouse is pointing at (while hover focus is enabled, or when you press Cmd/Ctrl+Shift+H), (2) readable page text when you press “Capture tab” or Alt/Option-click to solve a question, and (3) on Chrome only, tab audio if you click “Record tab audio” and then click stop.',
        'How we reduce sensitive data exposure: before sending page text to our services, we format it for readability and redact password- and payment-card-like lines; we also apply size limits.',
        'How we use it: the captured text (or a user-started tab-audio transcript) is used to generate a grounded answer or a transcript in your active workspace. We do not claim knowledge of page content that is not present in the captured text.',
        'User controls: cursor hover focus can be disabled in the extension settings. Even with hover disabled, “Capture tab” and Alt/Option-click to solve still work. Tab audio never runs until you click Record, and it stops when you click Stop.',
        'Sign-in: Google and other Clerk sign-in flows run in a normal browser tab. The extension panel then stores a short-lived connect token so Ask can run without embedding the sign-in page in the iframe.',
        'Data destination: the extension sends the captured payload to Aproko’s authenticated web API; our backend processes the request and may forward relevant context to our configured AI provider to generate the response.',
        'Storage: captured page context is used for the generation request and is not persisted as a long-lived “source” object unless you explicitly save content in the web app. User-started recordings are saved as transcripts you can delete from Transcripts.',
        'Library saves: when you ask after capturing a tab, Aproko may save the sanitized page text as a `.txt` source in your workspace library (`live-context` folder) so you can search and reuse it later. Follow-up questions on the same capture do not create duplicate sources.',
        'Out of scope: we do not capture your desktop or other applications, we do not tap operating-system meeting audio, we do not provide a native mobile app, and we do not record tabs in the background.',
      ],
    },
    {
      id: 'sharing',
      title: 'How we share information',
      paragraphs: [
        'We do not sell your personal information. We share data only with service providers that help us operate Aproko AI, such as hosting, authentication, storage, analytics, error monitoring, and payment processing. These providers are permitted to process data only to deliver services to us.',
        'We may disclose information if required by law, to protect users and the service, or in connection with a merger, acquisition, or asset sale with appropriate safeguards.',
      ],
    },
    {
      id: 'retention-security',
      title: 'Retention and security',
      paragraphs: [
        'We retain account and workspace data for as long as your account is active or as needed to provide the service, comply with law, resolve disputes, and enforce agreements.',
        'We apply administrative, technical, and organizational measures designed to protect data, including tenant isolation by workspace, encrypted transport, and least-privilege access controls. No method of transmission or storage is completely secure.',
      ],
    },
    {
      id: 'your-rights',
      title: 'Your choices and rights',
      paragraphs: [
        'Depending on your location, you may have rights to access, correct, delete, or export personal data, or to object to or restrict certain processing. You can manage much of your workspace content directly in the product.',
        'To make a privacy request, contact us using the details below. We may need to verify your identity before fulfilling a request.',
      ],
    },
    {
      id: 'international',
      title: 'International transfers',
      paragraphs: [
        'If you access Aproko AI from outside the country where our infrastructure providers operate, your information may be processed in other jurisdictions with different data protection laws. We take steps designed to ensure appropriate safeguards where required.',
      ],
    },
    {
      id: 'children',
      title: 'Children',
      paragraphs: [
        'Aproko AI is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us so we can take appropriate action.',
      ],
    },
    {
      id: 'changes-contact',
      title: 'Changes and contact',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will post the revised version on this page and update the "Last updated" date above.',
        'Questions about this Privacy Policy or our data practices: privacy@aproko.ai',
      ],
    },
  ],
};

export const termsContent: LegalPageContent = {
  title: 'Terms of Service',
  lastUpdated: 'March 1, 2026',
  intro:
    'These Terms of Service ("Terms") govern your access to and use of Aproko AI. By creating an account or using the service, you agree to these Terms.',
  sections: [
    {
      id: 'service',
      title: 'The service',
      paragraphs: [
        'Aproko AI is a web-based knowledge operating system that helps you upload documents, chat with citations, build memory, and generate study outputs within a workspace. Features may change over time as we improve the product.',
        'We may offer free and paid plans. Plan limits, features, and pricing are described on our website and in-product billing pages.',
      ],
    },
    {
      id: 'accounts',
      title: 'Accounts and eligibility',
      paragraphs: [
        'You must provide accurate account information and keep your credentials secure. You are responsible for activity that occurs under your account.',
        'You must be old enough to form a binding contract in your jurisdiction and not barred from using the service under applicable law.',
      ],
    },
    {
      id: 'your-content',
      title: 'Your content',
      paragraphs: [
        'You retain ownership of content you upload or create in Aproko AI. You grant us a limited license to host, process, index, and display your content solely to operate and improve the service for you and your authorized workspace members.',
        'You represent that you have the rights necessary to submit your content and that your content does not infringe third-party rights or violate law.',
      ],
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      paragraphs: ['You agree not to:'],
      bullets: [
        'Use the service for unlawful, harmful, or abusive purposes.',
        "Attempt to bypass security, access another user's workspace without authorization, or probe or scan systems without permission.",
        'Upload malware or interfere with service integrity or performance.',
        'Misrepresent AI-generated output as human-authored professional advice where doing so would be misleading or unlawful.',
        'Reverse engineer or resell the service except as expressly permitted by us.',
      ],
    },
    {
      id: 'ai-disclaimer',
      title: 'AI outputs and disclaimers',
      paragraphs: [
        'AI responses may be incomplete, outdated, or incorrect. You are responsible for reviewing outputs and verifying citations before relying on them for academic, legal, medical, financial, or other high-stakes decisions.',
        'Aproko AI is provided for productivity and learning support. It is not a substitute for professional judgment.',
      ],
    },
    {
      id: 'billing',
      title: 'Subscriptions and billing',
      paragraphs: [
        'Paid plans renew according to the billing interval you select unless canceled. Fees are charged through our payment processor. Taxes may apply where required by law.',
        'You may cancel a subscription according to in-product billing controls. Except where required by law, fees already paid are non-refundable.',
      ],
    },
    {
      id: 'termination',
      title: 'Suspension and termination',
      paragraphs: [
        'You may stop using the service at any time. We may suspend or terminate access if you violate these Terms, create risk for other users, or where required for security or legal compliance.',
        'Upon termination, your right to use the service ends. Provisions that by nature should survive termination will continue to apply.',
      ],
    },
    {
      id: 'disclaimers-liability',
      title: 'Disclaimers and limitation of liability',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, APROKO AI AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF USD $100 OR THE AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.',
      ],
    },
    {
      id: 'general',
      title: 'General',
      paragraphs: [
        'These Terms constitute the entire agreement between you and Aproko AI regarding the service and supersede prior agreements on the same subject.',
        'If a provision is found unenforceable, the remaining provisions remain in effect. Our failure to enforce a provision is not a waiver.',
        'We may update these Terms by posting a revised version on this page. Continued use after changes become effective constitutes acceptance of the updated Terms.',
        'Questions about these Terms: legal@aproko.ai',
      ],
    },
  ],
};
