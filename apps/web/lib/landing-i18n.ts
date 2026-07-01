import { type PlanCode, type PricingPlan } from '@/lib/pricing-plans';

export type LandingLocale = 'en' | 'fr' | 'es' | 'de' | 'pt';

export const LANDING_LOCALE_STORAGE_KEY = 'aproko-landing-locale';

export const landingLocales: { code: LandingLocale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
];

export type LandingCopy = {
  nav: {
    home: string;
    product: string;
    pricing: string;
    blog: string;
    dashboard: string;
    signIn: string;
    startFree: string;
    start: string;
  };
  hero: {
    title: string;
    subtitle: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  workflow: {
    title: string;
    titleAccent: string;
    items: { title: string; copy: string }[];
  };
  memory: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: { num: string; title: string; copy: string }[];
  };
  documents: {
    title: string;
    subtitle: string;
    items: { title: string; copy: string }[];
  };
  ask: {
    eyebrow: string;
    title: string;
    ready: string;
    via: string;
    question: string;
    answerPrefix: string;
    answer: string;
  };
  compare: {
    title: string;
    subtitle: string;
    standardTitle: string;
    standardSteps: string[];
    aprokoTitle: string;
    aprokoSteps: string[];
  };
  features: { title: string; copy: string }[];
  study: { title: string; copy: string }[];
  social: {
    title: string;
    subtitle: string;
    demo: string;
    view: string;
    moments: { handle: string; label: string; quote: string; initials: string }[];
  };
  pricing: {
    title: string;
    badge: string;
    subtitle: string;
    footer: string;
    currentPlan: string;
  };
  blog: {
    eyebrow: string;
    title: string;
    subtitle: string;
    pageTitle: string;
    pageSubtitle: string;
    viewAll: string;
    allArticles: string;
    allCategories: string;
    articlesLabel: string;
    categories: {
      company: string;
      guides: string;
      productivity: string;
      study: string;
      writing: string;
    };
  };
  cta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    button: string;
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  footer: {
    tagline: string;
    company: string;
    about: string;
    blog: string;
    pricing: string;
    signIn: string;
    stayUpdated: string;
    newsletter: string;
    emailPlaceholder: string;
    copyright: string;
    disclaimer: string;
    privacy: string;
    terms: string;
    startFree: string;
  };
  legal: {
    lastUpdated: string;
  };
  auth: {
    welcome: string;
    previewWorkspace: string;
    points: string[];
    signIn: {
      title: string;
      subtitle: string;
      footerPrompt: string;
      footerLink: string;
    };
    signUp: {
      title: string;
      subtitle: string;
      footerPrompt: string;
      footerLink: string;
    };
  };
};

const en: LandingCopy = {
  nav: {
    home: 'Home',
    product: 'Product',
    pricing: 'Pricing',
    blog: 'Blog',
    dashboard: 'Dashboard',
    signIn: 'Sign in',
    startFree: 'Start free',
    start: 'Start',
  },
  hero: {
    title: 'AI that sees, hears, and remembers everything.',
    subtitle:
      'Upload documents, chat with citations, and build long-term memory — one web workspace for knowledge work.',
  },
  dashboard: {
    eyebrow: 'Your workspace',
    title: 'A dashboard built for knowledge work',
    subtitle: 'Metrics, recent activity, and quick actions — the same view you get after sign-in.',
  },
  workflow: {
    title: 'AI knowledge layer on every workflow,',
    titleAccent: 'helping you stay in flow',
    items: [
      {
        title: 'Quick capture',
        copy: 'Upload documents and transcripts into one workspace — no scattered tabs.',
      },
      {
        title: 'Just ask',
        copy: 'Press ⌘K to search or open chat. Ask in plain language with your library as context.',
      },
      {
        title: 'Instant answer',
        copy: 'Get grounded responses with citations in seconds, not copy-paste cycles.',
      },
    ],
  },
  memory: {
    eyebrow: 'Perfect memory',
    title: 'Intelligence that follows you everywhere',
    subtitle:
      'Aproko remembers your documents, chats, and study outputs — so you can ask questions later and get answers with sources.',
    steps: [
      {
        num: '01',
        title: 'Automatic capture',
        copy: 'Documents, chats, and study outputs get indexed while you work — no manual filing.',
      },
      {
        num: '02',
        title: 'Ask in plain English',
        copy: 'Ask a question like you would to a colleague. Get a short answer with the source.',
      },
      {
        num: '03',
        title: 'Private by default',
        copy: 'Your data stays yours. Workspace isolation, no public feed, no shared index.',
      },
    ],
  },
  documents: {
    title: 'Understand every document, remember everything.',
    subtitle:
      'Upload PDFs, slides, and transcripts. Search them, summarize them, or turn them into notes, flashcards, and quizzes — all in one click.',
    items: [
      {
        title: 'Live indexing',
        copy: 'See documents become searchable as processing completes.',
      },
      {
        title: 'Summaries & notes',
        copy: 'Generate summaries or action items from any source in one click.',
      },
      {
        title: 'Completely private',
        copy: 'Your files stay in your workspace. Tenant isolation by design.',
      },
    ],
  },
  ask: {
    eyebrow: 'Ask',
    title: 'Ask in natural language. Stay in flow while you work.',
    ready: 'Ready',
    via: 'via chat or ⌘K search',
    question: 'Can you walk me through this using what\u2019s in my research workspace?',
    answerPrefix: 'Aproko:',
    answer:
      'Based on your uploaded sources, here\u2019s a step-by-step breakdown with citations from your library.',
  },
  compare: {
    title: 'Generic chat can\u2019t see your knowledge base',
    subtitle:
      'Aproko sits inside your workspace and uses your library, memory, and research context automatically.',
    standardTitle: 'Standard workflow',
    standardSteps: [
      'Open a chat tab',
      'Copy text from your document',
      'Paste context manually',
      'Wait for a response',
      'Switch back and figure out how to apply it',
    ],
    aprokoTitle: 'Aproko AI — 2 steps',
    aprokoSteps: [
      '1. Ask in chat or search',
      '2. Get an answer grounded in your library with citations',
    ],
  },
  features: [
    {
      title: 'Upload & understand documents',
      copy: 'PDF, DOCX, PPT, and images are parsed, chunked, and searchable with OCR support.',
    },
    {
      title: 'Structured notes with citations',
      copy: 'Every AI answer links back to the source chunk so you can verify and reuse confidently.',
    },
    {
      title: 'Multi-model intelligence',
      copy: 'Route queries across OpenAI, Anthropic, Gemini, and more from one workspace.',
    },
    {
      title: 'Full web ecosystem',
      copy: 'One account across chat, library, memory, research, and study — all synced in the cloud.',
    },
  ],
  study: [
    {
      title: 'Study outputs in one click',
      copy: 'Generate summaries, flashcards, and quizzes from your own materials.',
    },
    {
      title: 'Memory timeline',
      copy: 'Track what you learned and when — context that compounds over time.',
    },
    {
      title: 'Research workspace',
      copy: 'Collect sources, notes, and AI synthesis in one focused flow.',
    },
  ],
  social: {
    title: 'Real moments from our users',
    subtitle: 'See how students and teams use Aproko to stay in flow with grounded AI.',
    demo: 'Watch demo',
    view: 'View',
    moments: [
      {
        handle: 'sarah.aproko',
        label: 'Research workflow',
        quote: 'Uploaded 40 papers and asked follow-ups with citations in one session.',
        initials: 'SA',
      },
      {
        handle: 'marcus.aproko',
        label: 'Study session',
        quote: 'Flashcards from my lecture notes — no manual copy-paste from generic chat.',
        initials: 'MA',
      },
      {
        handle: 'team.aproko',
        label: 'Shared workspace',
        quote: 'Our team library keeps research context in one place instead of scattered docs.',
        initials: 'TA',
      },
      {
        handle: 'lina.aproko',
        label: 'Exam prep',
        quote: 'Quizzes generated from my course PDFs helped me review twice as fast.',
        initials: 'LA',
      },
      {
        handle: 'dev.aproko',
        label: 'Engineering notes',
        quote: 'Code docs and RFCs in one library — chat answers always cite the source file.',
        initials: 'DA',
      },
    ],
  },
  pricing: {
    title: 'Simple pricing, no surprises.',
    badge: 'Start free, no credit card required',
    subtitle: 'Upgrade anytime. You only pay if you choose Pro or Teams.',
    footer: 'Create your account to start free. Upgrade to Pro or Teams anytime from billing.',
    currentPlan: 'Current plan',
  },
  blog: {
    eyebrow: 'From the blog',
    title: 'Guides for knowledge work',
    subtitle:
      'Practical workflows for building memory, studying with citations, and getting more from your library.',
    pageTitle: 'Aproko AI Blog',
    pageSubtitle:
      'Product updates, study workflows, and guides for building a personal knowledge base with grounded AI.',
    viewAll: 'View all articles',
    allArticles: 'All articles',
    allCategories: 'All',
    articlesLabel: 'articles',
    categories: {
      company: 'Company',
      guides: 'Guides',
      productivity: 'Productivity',
      study: 'Study',
      writing: 'Writing',
    },
  },
  cta: {
    eyebrow: 'Get started',
    titleLine1: 'Stop switching tabs.',
    titleLine2: 'Start finishing faster.',
    subtitle:
      'One workspace for AI answers, document understanding, memory, and study tools. Start free — no card required.',
    button: 'Start free',
  },
  faq: {
    title: 'Frequently asked questions about Aproko AI',
    items: [
      {
        question: 'What is Aproko AI?',
        answer:
          'Aproko AI is the AI knowledge operating system for students and teams. It helps you upload documents, chat with citations, build long-term memory, and generate study outputs — all in one web workspace.',
      },
      {
        question: 'How is Aproko AI different from ChatGPT or other AI tools?',
        answer:
          'Generic chat apps require you to copy context into a browser tab. Aproko AI is built around your library, memory timeline, and retrieval pipeline — so answers stay grounded in your own materials with source citations.',
      },
      {
        question: 'Is Aproko AI free?',
        answer:
          'Yes. You can start free with core workspace features and limited AI queries — no credit card required. Pro plans unlock unlimited usage and advanced workflows.',
      },
      {
        question: 'What file types does Aproko AI support?',
        answer:
          'PDF, DOCX, PPT, images, and meeting transcripts. Files are parsed, chunked, embedded, and searchable across your workspace library and chat.',
      },
      {
        question: 'Does Aproko AI store my data privately?',
        answer:
          'Yes. Your workspace data is isolated by account. Aproko does not publish a public feed or shared index of your knowledge.',
      },
      {
        question: 'How do I get started?',
        answer:
          'Create a free account, upload your first documents to the library, then open chat or search to ask questions grounded in your materials.',
      },
    ],
  },
  footer: {
    tagline:
      'AI knowledge operating system — chat, memory, library, and study tools in one web workspace.',
    company: 'Company',
    about: 'About Aproko AI',
    blog: 'Blog',
    pricing: 'Pricing',
    signIn: 'Sign in',
    stayUpdated: 'Stay updated',
    newsletter: 'Product updates and tips, straight to your inbox.',
    emailPlaceholder: 'you@email.com',
    copyright: '© 2026 Aproko AI. All rights reserved.',
    disclaimer:
      'Built for knowledge work on the web — library, chat with citations, memory, and study tools in one workspace.',
    privacy: 'Privacy',
    terms: 'Terms',
    startFree: 'Start free',
  },
  legal: {
    lastUpdated: 'Last updated',
  },
  auth: {
    welcome: 'Welcome',
    previewWorkspace: 'Preview your workspace',
    points: [
      'Organize knowledge with projects and folders',
      'Chat with citations and memory context',
      'Generate notes, flashcards, and quizzes',
    ],
    signIn: {
      title: 'Welcome back',
      subtitle: 'Sign in to continue building your memory graph, chats, and study outputs.',
      footerPrompt: 'New to Aproko AI? ',
      footerLink: 'Create account',
    },
    signUp: {
      title: 'Create your workspace',
      subtitle:
        'Create your account to start capturing, retrieving, and reusing everything you know.',
      footerPrompt: 'Already have an account? ',
      footerLink: 'Sign in',
    },
  },
};

const fr: LandingCopy = {
  ...en,
  nav: {
    home: 'Accueil',
    product: 'Produit',
    pricing: 'Tarifs',
    blog: 'Blog',
    dashboard: 'Tableau de bord',
    signIn: 'Connexion',
    startFree: 'Commencer gratuitement',
    start: 'Démarrer',
  },
  hero: {
    title: 'Une IA qui voit, entend et se souvient de tout.',
    subtitle:
      'Importez des documents, discutez avec des citations et construisez une mémoire à long terme — un seul espace web pour le travail de connaissance.',
  },
  dashboard: {
    eyebrow: 'Votre espace',
    title: 'Un tableau de bord conçu pour le travail de connaissance',
    subtitle:
      'Métriques, activité récente et actions rapides — la même vue qu\u2019après connexion.',
  },
  workflow: {
    title: 'Une couche de connaissance IA sur chaque flux,',
    titleAccent: 'pour rester dans le flow',
    items: [
      {
        title: 'Capture rapide',
        copy: 'Importez documents et transcriptions dans un seul espace — sans onglets éparpillés.',
      },
      {
        title: 'Demandez simplement',
        copy: 'Appuyez sur ⌘K pour rechercher ou ouvrir le chat. Posez vos questions avec votre bibliothèque en contexte.',
      },
      {
        title: 'Réponse instantanée',
        copy: 'Obtenez des réponses fondées avec citations en secondes, sans copier-coller.',
      },
    ],
  },
  memory: {
    eyebrow: 'Mémoire parfaite',
    title: 'Une intelligence qui vous suit partout',
    subtitle:
      'Aproko retient vos documents, chats et résultats d\u2019étude — pour poser des questions plus tard avec des sources.',
    steps: [
      {
        num: '01',
        title: 'Capture automatique',
        copy: 'Documents, chats et sorties d\u2019étude indexés pendant que vous travaillez — sans classement manuel.',
      },
      {
        num: '02',
        title: 'Posez vos questions',
        copy: 'Comme à un collègue. Obtenez une réponse courte avec la source.',
      },
      {
        num: '03',
        title: 'Privé par défaut',
        copy: 'Vos données restent les vôtres. Isolation par espace, pas de fil public ni d\u2019index partagé.',
      },
    ],
  },
  documents: {
    title: 'Comprenez chaque document, retenez tout.',
    subtitle:
      'Importez PDF, diapositives et transcriptions. Recherchez, résumez ou transformez en notes, flashcards et quiz — en un clic.',
    items: [
      {
        title: 'Indexation en direct',
        copy: 'Voyez vos documents devenir consultables au fil du traitement.',
      },
      {
        title: 'Résumés et notes',
        copy: 'Générez résumés ou actions à partir de n\u2019importe quelle source en un clic.',
      },
      {
        title: 'Entièrement privé',
        copy: 'Vos fichiers restent dans votre espace. Isolation des locataires par conception.',
      },
    ],
  },
  ask: {
    eyebrow: 'Demander',
    title: 'Posez vos questions naturellement. Restez concentré.',
    ready: 'Prêt',
    via: 'via chat ou recherche ⌘K',
    question: 'Peux-tu m\u2019expliquer cela avec ce qui est dans mon espace de recherche ?',
    answerPrefix: 'Aproko :',
    answer:
      'D\u2019après vos sources importées, voici une explication étape par étape avec citations de votre bibliothèque.',
  },
  compare: {
    title: 'Le chat générique ne voit pas votre base de connaissance',
    subtitle:
      'Aproko vit dans votre espace et utilise automatiquement bibliothèque, mémoire et contexte de recherche.',
    standardTitle: 'Flux standard',
    standardSteps: [
      'Ouvrir un onglet de chat',
      'Copier le texte du document',
      'Coller le contexte manuellement',
      'Attendre une réponse',
      'Revenir en arrière pour l\u2019appliquer',
    ],
    aprokoTitle: 'Aproko AI — 2 étapes',
    aprokoSteps: [
      '1. Demander dans le chat ou la recherche',
      '2. Obtenir une réponse fondée sur votre bibliothèque avec citations',
    ],
  },
  features: [
    {
      title: 'Importer et comprendre les documents',
      copy: 'PDF, DOCX, PPT et images analysés, découpés et consultables avec OCR.',
    },
    {
      title: 'Notes structurées avec citations',
      copy: 'Chaque réponse IA renvoie au segment source pour vérifier et réutiliser en confiance.',
    },
    {
      title: 'Intelligence multi-modèles',
      copy: 'Routez les requêtes vers OpenAI, Anthropic, Gemini et plus depuis un seul espace.',
    },
    {
      title: 'Écosystème web complet',
      copy: 'Un compte pour chat, bibliothèque, mémoire, recherche et étude — synchronisé dans le cloud.',
    },
  ],
  study: [
    {
      title: 'Sorties d\u2019étude en un clic',
      copy: 'Générez résumés, flashcards et quiz à partir de vos propres matériaux.',
    },
    {
      title: 'Chronologie de mémoire',
      copy: 'Suivez ce que vous avez appris et quand — un contexte qui s\u2019accumule.',
    },
    {
      title: 'Espace de recherche',
      copy: 'Rassemblez sources, notes et synthèse IA dans un flux unique.',
    },
  ],
  social: {
    title: 'Moments réels de nos utilisateurs',
    subtitle:
      'Découvrez comment étudiants et équipes utilisent Aproko pour rester dans le flow avec une IA fondée.',
    demo: 'Voir la démo',
    view: 'Voir',
    moments: [
      {
        handle: 'sarah.aproko',
        label: 'Flux de recherche',
        quote: '40 articles importés et questions de suivi avec citations en une session.',
        initials: 'SA',
      },
      {
        handle: 'marcus.aproko',
        label: 'Session d\u2019étude',
        quote:
          'Flashcards depuis mes notes de cours — sans copier-coller depuis un chat générique.',
        initials: 'MA',
      },
      {
        handle: 'team.aproko',
        label: 'Espace partagé',
        quote: 'Notre bibliothèque d\u2019équipe centralise le contexte de recherche.',
        initials: 'TA',
      },
      {
        handle: 'lina.aproko',
        label: 'Préparation examen',
        quote: 'Quiz générés depuis mes PDF de cours — révision deux fois plus rapide.',
        initials: 'LA',
      },
      {
        handle: 'dev.aproko',
        label: 'Notes d\u2019ingénierie',
        quote: 'Docs et RFC dans une bibliothèque — le chat cite toujours le fichier source.',
        initials: 'DA',
      },
    ],
  },
  pricing: {
    title: 'Tarifs simples, sans surprise.',
    badge: 'Commencez gratuitement, sans carte bancaire',
    subtitle: 'Passez à Pro ou Teams quand vous voulez.',
    footer: 'Créez votre compte gratuitement. Passez à Pro ou Teams depuis la facturation.',
    currentPlan: 'Forfait actuel',
  },
  cta: {
    eyebrow: 'Commencer',
    titleLine1: 'Arrêtez de changer d\u2019onglets.',
    titleLine2: 'Terminez plus vite.',
    subtitle:
      'Un espace pour réponses IA, compréhension documentaire, mémoire et outils d\u2019étude. Gratuit — sans carte.',
    button: 'Commencer gratuitement',
  },
  faq: {
    title: 'Questions fréquentes sur Aproko AI',
    items: en.faq.items.map((item, i) =>
      i === 0
        ? {
            question: 'Qu\u2019est-ce qu\u2019Aproko AI ?',
            answer:
              'Aproko AI est le système d\u2019exploitation de connaissance IA pour étudiants et équipes. Importez des documents, discutez avec citations, construisez une mémoire et générez des sorties d\u2019étude — dans un seul espace web.',
          }
        : i === 1
          ? {
              question: 'En quoi Aproko AI diffère-t-il de ChatGPT ?',
              answer:
                'Les chats génériques exigent de copier le contexte. Aproko AI est construit autour de votre bibliothèque, chronologie de mémoire et pipeline de recherche — réponses fondées sur vos matériaux avec citations.',
            }
          : i === 2
            ? {
                question: 'Aproko AI est-il gratuit ?',
                answer:
                  'Oui. Commencez gratuitement avec les fonctions essentielles et des requêtes IA limitées — sans carte. Pro débloque l\u2019usage illimité et les flux avancés.',
              }
            : i === 3
              ? {
                  question: 'Quels types de fichiers sont pris en charge ?',
                  answer:
                    'PDF, DOCX, PPT, images et transcriptions de réunions. Fichiers analysés, découpés, embeddés et consultables dans bibliothèque et chat.',
                }
              : i === 4
                ? {
                    question: 'Mes données sont-elles privées ?',
                    answer:
                      'Oui. Vos données d\u2019espace sont isolées par compte. Aproko ne publie pas de fil public ni d\u2019index partagé.',
                  }
                : {
                    question: 'Comment commencer ?',
                    answer:
                      'Créez un compte gratuit, importez vos premiers documents, puis ouvrez chat ou recherche pour poser des questions fondées sur vos matériaux.',
                  },
    ),
  },
  footer: {
    tagline:
      'Système d\u2019exploitation de connaissance IA — chat, mémoire, bibliothèque et outils d\u2019étude dans un espace web.',
    company: 'Entreprise',
    about: 'À propos d\u2019Aproko AI',
    blog: 'Blog',
    pricing: 'Tarifs',
    signIn: 'Connexion',
    stayUpdated: 'Restez informé',
    newsletter: 'Actualités produit et conseils, directement dans votre boîte mail.',
    emailPlaceholder: 'vous@email.com',
    copyright: '© 2026 Aproko AI. Tous droits réservés.',
    disclaimer:
      'Conçu pour le travail de connaissance sur le web — bibliothèque, chat avec citations, mémoire et outils d\u2019étude.',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    startFree: 'Commencer gratuitement',
  },
  legal: {
    lastUpdated: 'Dernière mise à jour',
  },
  auth: {
    welcome: 'Bienvenue',
    previewWorkspace: 'Aperçu de votre espace',
    points: [
      'Organisez vos connaissances avec projets et dossiers',
      'Discutez avec citations et contexte de mémoire',
      'Générez notes, flashcards et quiz',
    ],
    signIn: {
      title: 'Bon retour',
      subtitle:
        'Connectez-vous pour continuer votre graphe de mémoire, chats et sorties d\u2019étude.',
      footerPrompt: 'Nouveau sur Aproko AI ? ',
      footerLink: 'Créer un compte',
    },
    signUp: {
      title: 'Créez votre espace',
      subtitle: 'Créez votre compte pour capturer, retrouver et réutiliser tout ce que vous savez.',
      footerPrompt: 'Vous avez déjà un compte ? ',
      footerLink: 'Connexion',
    },
  },
};

const es: LandingCopy = {
  ...en,
  nav: {
    home: 'Inicio',
    product: 'Producto',
    pricing: 'Precios',
    blog: 'Blog',
    dashboard: 'Panel',
    signIn: 'Iniciar sesión',
    startFree: 'Empezar gratis',
    start: 'Empezar',
  },
  hero: {
    title: 'IA que ve, escucha y recuerda todo.',
    subtitle:
      'Sube documentos, chatea con citas y construye memoria a largo plazo — un espacio web para el trabajo del conocimiento.',
  },
  dashboard: {
    eyebrow: 'Tu espacio',
    title: 'Un panel diseñado para el trabajo del conocimiento',
    subtitle:
      'Métricas, actividad reciente y acciones rápidas — la misma vista tras iniciar sesión.',
  },
  workflow: {
    title: 'Capa de conocimiento IA en cada flujo,',
    titleAccent: 'para mantener el ritmo',
    items: [
      {
        title: 'Captura rápida',
        copy: 'Sube documentos y transcripciones a un solo espacio — sin pestañas dispersas.',
      },
      {
        title: 'Solo pregunta',
        copy: 'Pulsa ⌘K para buscar o abrir el chat. Pregunta con tu biblioteca como contexto.',
      },
      {
        title: 'Respuesta instantánea',
        copy: 'Obtén respuestas fundamentadas con citas en segundos, sin copiar y pegar.',
      },
    ],
  },
  memory: {
    eyebrow: 'Memoria perfecta',
    title: 'Inteligencia que te acompaña a todas partes',
    subtitle:
      'Aproko recuerda tus documentos, chats y resultados de estudio — para preguntar después con fuentes.',
    steps: [
      {
        num: '01',
        title: 'Captura automática',
        copy: 'Documentos, chats y salidas de estudio indexados mientras trabajas — sin archivar manualmente.',
      },
      {
        num: '02',
        title: 'Pregunta en lenguaje natural',
        copy: 'Como a un colega. Obtén una respuesta breve con la fuente.',
      },
      {
        num: '03',
        title: 'Privado por defecto',
        copy: 'Tus datos son tuyos. Aislamiento por espacio, sin feed público ni índice compartido.',
      },
    ],
  },
  documents: {
    title: 'Comprende cada documento, recuerda todo.',
    subtitle:
      'Sube PDF, diapositivas y transcripciones. Búscalos, resume o conviértelos en notas, flashcards y cuestionarios — en un clic.',
    items: [
      {
        title: 'Indexación en vivo',
        copy: 'Ve cómo los documentos se vuelven buscables al completarse el procesamiento.',
      },
      {
        title: 'Resúmenes y notas',
        copy: 'Genera resúmenes o acciones desde cualquier fuente en un clic.',
      },
      {
        title: 'Totalmente privado',
        copy: 'Tus archivos permanecen en tu espacio. Aislamiento de inquilinos por diseño.',
      },
    ],
  },
  ask: {
    eyebrow: 'Preguntar',
    title: 'Pregunta en lenguaje natural. Mantén el flujo mientras trabajas.',
    ready: 'Listo',
    via: 'vía chat o búsqueda ⌘K',
    question: '¿Puedes explicarme esto usando lo que hay en mi espacio de investigación?',
    answerPrefix: 'Aproko:',
    answer:
      'Según tus fuentes subidas, aquí tienes un desglose paso a paso con citas de tu biblioteca.',
  },
  compare: {
    title: 'El chat genérico no ve tu base de conocimiento',
    subtitle:
      'Aproko vive en tu espacio y usa biblioteca, memoria y contexto de investigación automáticamente.',
    standardTitle: 'Flujo estándar',
    standardSteps: [
      'Abrir una pestaña de chat',
      'Copiar texto del documento',
      'Pegar contexto manualmente',
      'Esperar una respuesta',
      'Volver y aplicar el resultado',
    ],
    aprokoTitle: 'Aproko AI — 2 pasos',
    aprokoSteps: [
      '1. Preguntar en chat o búsqueda',
      '2. Obtener respuesta fundamentada en tu biblioteca con citas',
    ],
  },
  features: [
    {
      title: 'Subir y comprender documentos',
      copy: 'PDF, DOCX, PPT e imágenes analizados, fragmentados y buscables con OCR.',
    },
    {
      title: 'Notas estructuradas con citas',
      copy: 'Cada respuesta IA enlaza al fragmento fuente para verificar y reutilizar con confianza.',
    },
    {
      title: 'Inteligencia multi-modelo',
      copy: 'Enruta consultas a OpenAI, Anthropic, Gemini y más desde un solo espacio.',
    },
    {
      title: 'Ecosistema web completo',
      copy: 'Una cuenta para chat, biblioteca, memoria, investigación y estudio — sincronizado en la nube.',
    },
  ],
  study: [
    {
      title: 'Salidas de estudio en un clic',
      copy: 'Genera resúmenes, flashcards y cuestionarios desde tus propios materiales.',
    },
    {
      title: 'Línea de tiempo de memoria',
      copy: 'Rastrea lo que aprendiste y cuándo — contexto que se acumula con el tiempo.',
    },
    {
      title: 'Espacio de investigación',
      copy: 'Reúne fuentes, notas y síntesis IA en un flujo enfocado.',
    },
  ],
  social: {
    title: 'Momentos reales de nuestros usuarios',
    subtitle:
      'Mira cómo estudiantes y equipos usan Aproko para mantener el flujo con IA fundamentada.',
    demo: 'Ver demo',
    view: 'Ver',
    moments: [
      {
        handle: 'sarah.aproko',
        label: 'Flujo de investigación',
        quote: 'Subí 40 artículos y hice seguimientos con citas en una sesión.',
        initials: 'SA',
      },
      {
        handle: 'marcus.aproko',
        label: 'Sesión de estudio',
        quote: 'Flashcards desde mis apuntes — sin copiar y pegar desde chat genérico.',
        initials: 'MA',
      },
      {
        handle: 'team.aproko',
        label: 'Espacio compartido',
        quote: 'Nuestra biblioteca de equipo centraliza el contexto de investigación.',
        initials: 'TA',
      },
      {
        handle: 'lina.aproko',
        label: 'Preparación de examen',
        quote: 'Cuestionarios desde mis PDF de curso — repasé el doble de rápido.',
        initials: 'LA',
      },
      {
        handle: 'dev.aproko',
        label: 'Notas de ingeniería',
        quote: 'Docs y RFC en una biblioteca — el chat siempre cita el archivo fuente.',
        initials: 'DA',
      },
    ],
  },
  pricing: {
    title: 'Precios simples, sin sorpresas.',
    badge: 'Empieza gratis, sin tarjeta de crédito',
    subtitle: 'Mejora cuando quieras. Solo pagas si eliges Pro o Teams.',
    footer: 'Crea tu cuenta gratis. Mejora a Pro o Teams desde facturación.',
    currentPlan: 'Plan actual',
  },
  cta: {
    eyebrow: 'Empezar',
    titleLine1: 'Deja de cambiar de pestañas.',
    titleLine2: 'Termina más rápido.',
    subtitle:
      'Un espacio para respuestas IA, comprensión documental, memoria y herramientas de estudio. Gratis — sin tarjeta.',
    button: 'Empezar gratis',
  },
  faq: {
    title: 'Preguntas frecuentes sobre Aproko AI',
    items: [
      {
        question: '¿Qué es Aproko AI?',
        answer:
          'Aproko AI es el sistema operativo de conocimiento IA para estudiantes y equipos. Sube documentos, chatea con citas, construye memoria y genera salidas de estudio — en un espacio web.',
      },
      {
        question: '¿En qué se diferencia de ChatGPT u otras herramientas?',
        answer:
          'Los chats genéricos exigen copiar contexto. Aproko AI se construye alrededor de tu biblioteca, línea de memoria y pipeline de búsqueda — respuestas fundamentadas con citas.',
      },
      {
        question: '¿Aproko AI es gratis?',
        answer:
          'Sí. Empieza gratis con funciones esenciales y consultas IA limitadas — sin tarjeta. Pro desbloquea uso ilimitado y flujos avanzados.',
      },
      {
        question: '¿Qué tipos de archivo admite?',
        answer:
          'PDF, DOCX, PPT, imágenes y transcripciones de reuniones. Archivos analizados, fragmentados, embeddados y buscables en biblioteca y chat.',
      },
      {
        question: '¿Mis datos se almacenan de forma privada?',
        answer:
          'Sí. Los datos de tu espacio están aislados por cuenta. Aproko no publica un feed público ni índice compartido.',
      },
      {
        question: '¿Cómo empiezo?',
        answer:
          'Crea una cuenta gratis, sube tus primeros documentos y abre chat o búsqueda para preguntar con tus materiales.',
      },
    ],
  },
  footer: {
    tagline:
      'Sistema operativo de conocimiento IA — chat, memoria, biblioteca y herramientas de estudio en un espacio web.',
    company: 'Empresa',
    about: 'Sobre Aproko AI',
    blog: 'Blog',
    pricing: 'Precios',
    signIn: 'Iniciar sesión',
    stayUpdated: 'Mantente al día',
    newsletter: 'Actualizaciones y consejos del producto, directo a tu bandeja.',
    emailPlaceholder: 'tu@email.com',
    copyright: '© 2026 Aproko AI. Todos los derechos reservados.',
    disclaimer:
      'Hecho para el trabajo de conocimiento en la web — biblioteca, chat con citas, memoria y herramientas de estudio.',
    privacy: 'Privacidad',
    terms: 'Términos',
    startFree: 'Empezar gratis',
  },
  legal: {
    lastUpdated: 'Última actualización',
  },
  auth: {
    welcome: 'Bienvenido',
    previewWorkspace: 'Vista previa de tu espacio',
    points: [
      'Organiza conocimiento con proyectos y carpetas',
      'Chatea con citas y contexto de memoria',
      'Genera notas, flashcards y cuestionarios',
    ],
    signIn: {
      title: 'Bienvenido de nuevo',
      subtitle:
        'Inicia sesión para seguir construyendo tu grafo de memoria, chats y salidas de estudio.',
      footerPrompt: '¿Nuevo en Aproko AI? ',
      footerLink: 'Crear cuenta',
    },
    signUp: {
      title: 'Crea tu espacio',
      subtitle: 'Crea tu cuenta para capturar, recuperar y reutilizar todo lo que sabes.',
      footerPrompt: '¿Ya tienes una cuenta? ',
      footerLink: 'Iniciar sesión',
    },
  },
};

const de: LandingCopy = {
  ...en,
  nav: {
    home: 'Startseite',
    product: 'Produkt',
    pricing: 'Preise',
    blog: 'Blog',
    dashboard: 'Dashboard',
    signIn: 'Anmelden',
    startFree: 'Kostenlos starten',
    start: 'Start',
  },
  hero: {
    title: 'KI, die alles sieht, hört und sich merkt.',
    subtitle:
      'Dokumente hochladen, mit Zitaten chatten und Langzeitgedächtnis aufbauen — ein Web-Arbeitsbereich für Wissensarbeit.',
  },
  dashboard: {
    eyebrow: 'Ihr Arbeitsbereich',
    title: 'Ein Dashboard für Wissensarbeit',
    subtitle:
      'Metriken, letzte Aktivität und Schnellaktionen — dieselbe Ansicht nach der Anmeldung.',
  },
  workflow: {
    title: 'KI-Wissensschicht in jedem Workflow,',
    titleAccent: 'damit Sie im Flow bleiben',
    items: [
      {
        title: 'Schnelle Erfassung',
        copy: 'Dokumente und Transkripte in einem Arbeitsbereich — ohne verstreute Tabs.',
      },
      {
        title: 'Einfach fragen',
        copy: '⌘K für Suche oder Chat. Fragen in natürlicher Sprache mit Ihrer Bibliothek als Kontext.',
      },
      {
        title: 'Sofortige Antwort',
        copy: 'Fundierte Antworten mit Zitaten in Sekunden, ohne Copy-Paste-Zyklen.',
      },
    ],
  },
  memory: {
    eyebrow: 'Perfektes Gedächtnis',
    title: 'Intelligenz, die Sie überall begleitet',
    subtitle:
      'Aproko merkt sich Dokumente, Chats und Lernergebnisse — für spätere Fragen mit Quellen.',
    steps: [
      {
        num: '01',
        title: 'Automatische Erfassung',
        copy: 'Dokumente, Chats und Studienoutputs werden beim Arbeiten indexiert — ohne manuelle Ablage.',
      },
      {
        num: '02',
        title: 'In natürlicher Sprache fragen',
        copy: 'Wie bei einem Kollegen. Kurze Antwort mit Quelle.',
      },
      {
        num: '03',
        title: 'Standardmäßig privat',
        copy: 'Ihre Daten bleiben Ihre. Arbeitsbereich-Isolation, kein öffentlicher Feed.',
      },
    ],
  },
  documents: {
    title: 'Jedes Dokument verstehen, alles behalten.',
    subtitle:
      'PDFs, Folien und Transkripte hochladen. Suchen, zusammenfassen oder in Notizen, Karteikarten und Quiz umwandeln — mit einem Klick.',
    items: [
      {
        title: 'Live-Indexierung',
        copy: 'Dokumente werden während der Verarbeitung durchsuchbar.',
      },
      {
        title: 'Zusammenfassungen & Notizen',
        copy: 'Zusammenfassungen oder Aufgaben aus jeder Quelle mit einem Klick.',
      },
      {
        title: 'Vollständig privat',
        copy: 'Dateien bleiben in Ihrem Arbeitsbereich. Mandantenisolation by Design.',
      },
    ],
  },
  ask: {
    eyebrow: 'Fragen',
    title: 'In natürlicher Sprache fragen. Im Flow bleiben.',
    ready: 'Bereit',
    via: 'über Chat oder ⌘K-Suche',
    question: 'Kannst du mir das anhand meines Forschungsarbeitsbereichs erklären?',
    answerPrefix: 'Aproko:',
    answer:
      'Basierend auf Ihren hochgeladenen Quellen: Schritt-für-Schritt-Erklärung mit Zitaten aus Ihrer Bibliothek.',
  },
  compare: {
    title: 'Generischer Chat sieht Ihre Wissensbasis nicht',
    subtitle:
      'Aproko sitzt in Ihrem Arbeitsbereich und nutzt Bibliothek, Gedächtnis und Forschungskontext automatisch.',
    standardTitle: 'Standard-Workflow',
    standardSteps: [
      'Chat-Tab öffnen',
      'Text aus Dokument kopieren',
      'Kontext manuell einfügen',
      'Auf Antwort warten',
      'Zurückwechseln und anwenden',
    ],
    aprokoTitle: 'Aproko AI — 2 Schritte',
    aprokoSteps: [
      '1. Im Chat oder in der Suche fragen',
      '2. Antwort aus Ihrer Bibliothek mit Zitaten erhalten',
    ],
  },
  features: [
    {
      title: 'Dokumente hochladen & verstehen',
      copy: 'PDF, DOCX, PPT und Bilder werden geparst, gechunked und mit OCR durchsuchbar.',
    },
    {
      title: 'Strukturierte Notizen mit Zitaten',
      copy: 'Jede KI-Antwort verlinkt zum Quellchunk — verifizieren und wiederverwenden.',
    },
    {
      title: 'Multi-Modell-Intelligenz',
      copy: 'Anfragen an OpenAI, Anthropic, Gemini und mehr aus einem Arbeitsbereich routen.',
    },
    {
      title: 'Vollständiges Web-Ökosystem',
      copy: 'Ein Konto für Chat, Bibliothek, Gedächtnis, Forschung und Lernen — in der Cloud synchronisiert.',
    },
  ],
  study: [
    {
      title: 'Lernoutputs mit einem Klick',
      copy: 'Zusammenfassungen, Karteikarten und Quiz aus eigenen Materialien generieren.',
    },
    {
      title: 'Gedächtnis-Zeitleiste',
      copy: 'Verfolgen, was Sie wann gelernt haben — Kontext, der sich aufbaut.',
    },
    {
      title: 'Forschungsarbeitsbereich',
      copy: 'Quellen, Notizen und KI-Synthese in einem fokussierten Flow sammeln.',
    },
  ],
  social: {
    title: 'Echte Momente unserer Nutzer',
    subtitle: 'So nutzen Studierende und Teams Aproko für fundierte KI im Flow.',
    demo: 'Demo ansehen',
    view: 'Ansehen',
    moments: [
      {
        handle: 'sarah.aproko',
        label: 'Forschungs-Workflow',
        quote: '40 Papers hochgeladen und Nachfragen mit Zitaten in einer Sitzung.',
        initials: 'SA',
      },
      {
        handle: 'marcus.aproko',
        label: 'Lernsitzung',
        quote: 'Karteikarten aus Vorlesungsnotizen — kein Copy-Paste aus generischem Chat.',
        initials: 'MA',
      },
      {
        handle: 'team.aproko',
        label: 'Geteilter Arbeitsbereich',
        quote: 'Team-Bibliothek hält Forschungskontext an einem Ort.',
        initials: 'TA',
      },
      {
        handle: 'lina.aproko',
        label: 'Prüfungsvorbereitung',
        quote: 'Quiz aus Kurs-PDFs — doppelt so schnell wiederholt.',
        initials: 'LA',
      },
      {
        handle: 'dev.aproko',
        label: 'Engineering-Notizen',
        quote: 'Code-Docs und RFCs in einer Bibliothek — Chat zitiert immer die Quelldatei.',
        initials: 'DA',
      },
    ],
  },
  pricing: {
    title: 'Einfache Preise, keine Überraschungen.',
    badge: 'Kostenlos starten, keine Kreditkarte nötig',
    subtitle: 'Jederzeit upgraden. Sie zahlen nur bei Pro oder Teams.',
    footer:
      'Konto erstellen und kostenlos starten. Upgrade zu Pro oder Teams jederzeit unter Abrechnung.',
    currentPlan: 'Aktueller Plan',
  },
  cta: {
    eyebrow: 'Loslegen',
    titleLine1: 'Schluss mit Tab-Wechseln.',
    titleLine2: 'Schneller fertig werden.',
    subtitle:
      'Ein Arbeitsbereich für KI-Antworten, Dokumentenverständnis, Gedächtnis und Lern-Tools. Kostenlos — ohne Karte.',
    button: 'Kostenlos starten',
  },
  faq: {
    title: 'Häufige Fragen zu Aproko AI',
    items: [
      {
        question: 'Was ist Aproko AI?',
        answer:
          'Aproko AI ist das KI-Wissens-Betriebssystem für Studierende und Teams. Dokumente hochladen, mit Zitaten chatten, Gedächtnis aufbauen und Lernoutputs generieren — in einem Web-Arbeitsbereich.',
      },
      {
        question: 'Wie unterscheidet sich Aproko AI von ChatGPT?',
        answer:
          'Generische Chats erfordern manuelles Kopieren von Kontext. Aproko AI baut auf Bibliothek, Gedächtnis-Zeitleiste und Retrieval — Antworten bleiben in Ihren Materialien mit Quellenzitaten verankert.',
      },
      {
        question: 'Ist Aproko AI kostenlos?',
        answer:
          'Ja. Kostenloser Start mit Kernfunktionen und begrenzten KI-Anfragen — ohne Karte. Pro schaltet unbegrenzte Nutzung und erweiterte Workflows frei.',
      },
      {
        question: 'Welche Dateitypen werden unterstützt?',
        answer:
          'PDF, DOCX, PPT, Bilder und Meeting-Transkripte. Dateien werden geparst, gechunked, embedded und in Bibliothek und Chat durchsuchbar.',
      },
      {
        question: 'Werden meine Daten privat gespeichert?',
        answer:
          'Ja. Arbeitsbereichsdaten sind pro Konto isoliert. Aproko veröffentlicht keinen öffentlichen Feed oder geteilten Index.',
      },
      {
        question: 'Wie fange ich an?',
        answer:
          'Kostenloses Konto erstellen, erste Dokumente hochladen, dann Chat oder Suche öffnen für fundierte Fragen.',
      },
    ],
  },
  footer: {
    tagline:
      'KI-Wissens-Betriebssystem — Chat, Gedächtnis, Bibliothek und Lern-Tools in einem Web-Arbeitsbereich.',
    company: 'Unternehmen',
    about: 'Über Aproko AI',
    blog: 'Blog',
    pricing: 'Preise',
    signIn: 'Anmelden',
    stayUpdated: 'Bleiben Sie informiert',
    newsletter: 'Produktupdates und Tipps direkt in Ihr Postfach.',
    emailPlaceholder: 'sie@email.com',
    copyright: '© 2026 Aproko AI. Alle Rechte vorbehalten.',
    disclaimer:
      'Für Wissensarbeit im Web — Bibliothek, Chat mit Zitaten, Gedächtnis und Lern-Tools in einem Arbeitsbereich.',
    privacy: 'Datenschutz',
    terms: 'AGB',
    startFree: 'Kostenlos starten',
  },
  legal: {
    lastUpdated: 'Zuletzt aktualisiert',
  },
  auth: {
    welcome: 'Willkommen',
    previewWorkspace: 'Vorschau Ihres Arbeitsbereichs',
    points: [
      'Wissen mit Projekten und Ordnern organisieren',
      'Mit Zitaten und Gedächtniskontext chatten',
      'Notizen, Karteikarten und Quiz generieren',
    ],
    signIn: {
      title: 'Willkommen zurück',
      subtitle:
        'Melden Sie sich an, um Ihren Gedächtnisgraphen, Chats und Lernoutputs weiter aufzubauen.',
      footerPrompt: 'Neu bei Aproko AI? ',
      footerLink: 'Konto erstellen',
    },
    signUp: {
      title: 'Arbeitsbereich erstellen',
      subtitle:
        'Erstellen Sie Ihr Konto, um alles Wissenswerte zu erfassen, abzurufen und wiederzuverwenden.',
      footerPrompt: 'Bereits ein Konto? ',
      footerLink: 'Anmelden',
    },
  },
};

const pt: LandingCopy = {
  ...en,
  nav: {
    home: 'Início',
    product: 'Produto',
    pricing: 'Preços',
    blog: 'Blog',
    dashboard: 'Painel',
    signIn: 'Entrar',
    startFree: 'Começar grátis',
    start: 'Começar',
  },
  hero: {
    title: 'IA que vê, ouve e lembra de tudo.',
    subtitle:
      'Envie documentos, converse com citações e construa memória de longo prazo — um espaço web para trabalho de conhecimento.',
  },
  dashboard: {
    eyebrow: 'Seu espaço',
    title: 'Um painel feito para trabalho de conhecimento',
    subtitle: 'Métricas, atividade recente e ações rápidas — a mesma visão após entrar.',
  },
  workflow: {
    title: 'Camada de conhecimento IA em cada fluxo,',
    titleAccent: 'para manter o ritmo',
    items: [
      {
        title: 'Captura rápida',
        copy: 'Envie documentos e transcrições para um espaço — sem abas espalhadas.',
      },
      {
        title: 'Só perguntar',
        copy: 'Pressione ⌘K para buscar ou abrir o chat. Pergunte com sua biblioteca como contexto.',
      },
      {
        title: 'Resposta instantânea',
        copy: 'Obtenha respostas fundamentadas com citações em segundos, sem copiar e colar.',
      },
    ],
  },
  memory: {
    eyebrow: 'Memória perfeita',
    title: 'Inteligência que te acompanha em todo lugar',
    subtitle:
      'Aproko lembra seus documentos, chats e resultados de estudo — para perguntar depois com fontes.',
    steps: [
      {
        num: '01',
        title: 'Captura automática',
        copy: 'Documentos, chats e saídas de estudo indexados enquanto você trabalha — sem arquivar manualmente.',
      },
      {
        num: '02',
        title: 'Pergunte em linguagem natural',
        copy: 'Como a um colega. Resposta curta com a fonte.',
      },
      {
        num: '03',
        title: 'Privado por padrão',
        copy: 'Seus dados são seus. Isolamento por espaço, sem feed público ou índice compartilhado.',
      },
    ],
  },
  documents: {
    title: 'Entenda cada documento, lembre de tudo.',
    subtitle:
      'Envie PDFs, slides e transcrições. Busque, resuma ou transforme em notas, flashcards e questionários — em um clique.',
    items: [
      {
        title: 'Indexação ao vivo',
        copy: 'Veja documentos ficarem pesquisáveis conforme o processamento termina.',
      },
      {
        title: 'Resumos e notas',
        copy: 'Gere resumos ou ações a partir de qualquer fonte em um clique.',
      },
      {
        title: 'Totalmente privado',
        copy: 'Seus arquivos ficam no seu espaço. Isolamento de inquilinos por design.',
      },
    ],
  },
  ask: {
    eyebrow: 'Perguntar',
    title: 'Pergunte em linguagem natural. Mantenha o fluxo enquanto trabalha.',
    ready: 'Pronto',
    via: 'via chat ou busca ⌘K',
    question: 'Pode me explicar isso usando o que está no meu espaço de pesquisa?',
    answerPrefix: 'Aproko:',
    answer:
      'Com base nas suas fontes enviadas, aqui está um passo a passo com citações da sua biblioteca.',
  },
  compare: {
    title: 'Chat genérico não vê sua base de conhecimento',
    subtitle:
      'Aproko fica no seu espaço e usa biblioteca, memória e contexto de pesquisa automaticamente.',
    standardTitle: 'Fluxo padrão',
    standardSteps: [
      'Abrir uma aba de chat',
      'Copiar texto do documento',
      'Colar contexto manualmente',
      'Esperar uma resposta',
      'Voltar e aplicar o resultado',
    ],
    aprokoTitle: 'Aproko AI — 2 passos',
    aprokoSteps: [
      '1. Perguntar no chat ou na busca',
      '2. Obter resposta fundamentada na sua biblioteca com citações',
    ],
  },
  features: [
    {
      title: 'Enviar e entender documentos',
      copy: 'PDF, DOCX, PPT e imagens analisados, fragmentados e pesquisáveis com OCR.',
    },
    {
      title: 'Notas estruturadas com citações',
      copy: 'Cada resposta IA liga ao trecho fonte para verificar e reutilizar com confiança.',
    },
    {
      title: 'Inteligência multi-modelo',
      copy: 'Encaminhe consultas para OpenAI, Anthropic, Gemini e mais de um espaço.',
    },
    {
      title: 'Ecossistema web completo',
      copy: 'Uma conta para chat, biblioteca, memória, pesquisa e estudo — sincronizado na nuvem.',
    },
  ],
  study: [
    {
      title: 'Saídas de estudo em um clique',
      copy: 'Gere resumos, flashcards e questionários dos seus próprios materiais.',
    },
    {
      title: 'Linha do tempo de memória',
      copy: 'Acompanhe o que aprendeu e quando — contexto que se acumula.',
    },
    {
      title: 'Espaço de pesquisa',
      copy: 'Reúna fontes, notas e síntese IA em um fluxo focado.',
    },
  ],
  social: {
    title: 'Momentos reais dos nossos usuários',
    subtitle: 'Veja como estudantes e equipes usam Aproko para manter o fluxo com IA fundamentada.',
    demo: 'Ver demo',
    view: 'Ver',
    moments: [
      {
        handle: 'sarah.aproko',
        label: 'Fluxo de pesquisa',
        quote: 'Enviei 40 artigos e fiz perguntas de acompanhamento com citações em uma sessão.',
        initials: 'SA',
      },
      {
        handle: 'marcus.aproko',
        label: 'Sessão de estudo',
        quote: 'Flashcards das minhas anotações — sem copiar e colar de chat genérico.',
        initials: 'MA',
      },
      {
        handle: 'team.aproko',
        label: 'Espaço compartilhado',
        quote: 'Biblioteca da equipe centraliza contexto de pesquisa em um lugar.',
        initials: 'TA',
      },
      {
        handle: 'lina.aproko',
        label: 'Preparação para prova',
        quote: 'Questionários dos PDFs do curso — revisei duas vezes mais rápido.',
        initials: 'LA',
      },
      {
        handle: 'dev.aproko',
        label: 'Notas de engenharia',
        quote: 'Docs e RFCs em uma biblioteca — o chat sempre cita o arquivo fonte.',
        initials: 'DA',
      },
    ],
  },
  pricing: {
    title: 'Preços simples, sem surpresas.',
    badge: 'Comece grátis, sem cartão de crédito',
    subtitle: 'Faça upgrade quando quiser. Você só paga se escolher Pro ou Teams.',
    footer: 'Crie sua conta grátis. Faça upgrade para Pro ou Teams na cobrança.',
    currentPlan: 'Plano atual',
  },
  cta: {
    eyebrow: 'Começar',
    titleLine1: 'Pare de trocar de abas.',
    titleLine2: 'Termine mais rápido.',
    subtitle:
      'Um espaço para respostas IA, compreensão documental, memória e ferramentas de estudo. Grátis — sem cartão.',
    button: 'Começar grátis',
  },
  faq: {
    title: 'Perguntas frequentes sobre Aproko AI',
    items: [
      {
        question: 'O que é Aproko AI?',
        answer:
          'Aproko AI é o sistema operacional de conhecimento IA para estudantes e equipes. Envie documentos, converse com citações, construa memória e gere saídas de estudo — em um espaço web.',
      },
      {
        question: 'Como Aproko AI difere do ChatGPT?',
        answer:
          'Chats genéricos exigem copiar contexto. Aproko AI é construído em torno da biblioteca, linha de memória e pipeline de busca — respostas fundamentadas com citações.',
      },
      {
        question: 'Aproko AI é grátis?',
        answer:
          'Sim. Comece grátis com funções essenciais e consultas IA limitadas — sem cartão. Pro desbloqueia uso ilimitado e fluxos avançados.',
      },
      {
        question: 'Quais tipos de arquivo são suportados?',
        answer:
          'PDF, DOCX, PPT, imagens e transcrições de reuniões. Arquivos analisados, fragmentados, embeddados e pesquisáveis na biblioteca e chat.',
      },
      {
        question: 'Meus dados são armazenados de forma privada?',
        answer:
          'Sim. Dados do espaço são isolados por conta. Aproko não publica feed público ou índice compartilhado.',
      },
      {
        question: 'Como começo?',
        answer:
          'Crie uma conta grátis, envie seus primeiros documentos e abra chat ou busca para perguntas fundamentadas.',
      },
    ],
  },
  footer: {
    tagline:
      'Sistema operacional de conhecimento IA — chat, memória, biblioteca e ferramentas de estudo em um espaço web.',
    company: 'Empresa',
    about: 'Sobre Aproko AI',
    blog: 'Blog',
    pricing: 'Preços',
    signIn: 'Entrar',
    stayUpdated: 'Fique atualizado',
    newsletter: 'Atualizações e dicas do produto, direto na sua caixa de entrada.',
    emailPlaceholder: 'voce@email.com',
    copyright: '© 2026 Aproko AI. Todos os direitos reservados.',
    disclaimer:
      'Feito para trabalho de conhecimento na web — biblioteca, chat com citações, memória e ferramentas de estudo.',
    privacy: 'Privacidade',
    terms: 'Termos',
    startFree: 'Começar grátis',
  },
  legal: {
    lastUpdated: 'Última atualização',
  },
  auth: {
    welcome: 'Bem-vindo',
    previewWorkspace: 'Prévia do seu espaço',
    points: [
      'Organize conhecimento com projetos e pastas',
      'Converse com citações e contexto de memória',
      'Gere notas, flashcards e questionários',
    ],
    signIn: {
      title: 'Bem-vindo de volta',
      subtitle: 'Entre para continuar construindo seu grafo de memória, chats e saídas de estudo.',
      footerPrompt: 'Novo no Aproko AI? ',
      footerLink: 'Criar conta',
    },
    signUp: {
      title: 'Crie seu espaço',
      subtitle: 'Crie sua conta para capturar, recuperar e reutilizar tudo o que você sabe.',
      footerPrompt: 'Já tem uma conta? ',
      footerLink: 'Entrar',
    },
  },
};

const copyByLocale: Record<LandingLocale, LandingCopy> = {
  en,
  fr,
  es,
  de,
  pt,
};

export function getLandingCopy(locale: LandingLocale): LandingCopy {
  return copyByLocale[locale] ?? en;
}

const pricingPlansByLocale: Record<LandingLocale, PricingPlan[]> = {
  en: [
    {
      code: 'free',
      badge: 'Free',
      title: 'FREE',
      price: '$0',
      period: '/forever',
      description: 'Start instantly. No credit card required.',
      features: [
        '100 AI queries included',
        'Core library & memory',
        'Basic search',
        'Flashcards & quizzes',
        'Upgrade anytime',
      ],
      cta: 'Start free',
    },
    {
      code: 'teams',
      badge: 'Teams',
      title: 'TEAMS',
      price: '$12',
      period: '/mo',
      description: 'Shared knowledge workspaces for small groups.',
      features: [
        'Shared library & memory',
        '500 AI queries / seat',
        'Workspace admin controls',
        'Collaborative research',
        'Flashcards & quizzes',
        'Syncs across web clients',
      ],
      cta: 'Upgrade to Teams',
    },
    {
      code: 'pro_monthly',
      title: 'PRO (MONTHLY)',
      price: '$20',
      period: '/mo',
      subPrice: 'or $160/yr (≈ $13.33/mo)',
      description: 'Unlimited everything. All features included.',
      features: [
        'Unlimited AI queries',
        'Advanced memory timeline',
        'Research workspace',
        'Priority model routing',
        'Flashcards & quizzes',
        'Long-term memory',
      ],
      cta: 'Upgrade monthly',
    },
    {
      code: 'pro_yearly',
      badge: 'Best value',
      title: 'PRO (YEARLY)',
      price: '$160',
      period: '/yr',
      subPrice: '≈ $13.33/mo • Save $80/yr vs monthly',
      description: 'Unlimited everything. All features included.',
      features: [
        'All Pro features',
        'Lower annual cost',
        'Priority support',
        'Long-term memory',
        'Research workspace',
        'Team-ready foundation',
      ],
      cta: 'Upgrade yearly',
      highlighted: true,
    },
  ],
  fr: [
    {
      code: 'free',
      badge: 'Gratuit',
      title: 'GRATUIT',
      price: '0 €',
      period: '/toujours',
      description: 'Commencez instantanément. Sans carte bancaire.',
      features: [
        '100 requêtes IA incluses',
        'Bibliothèque et mémoire de base',
        'Recherche basique',
        'Flashcards et quiz',
        'Upgrade à tout moment',
      ],
      cta: 'Commencer gratuitement',
    },
    {
      code: 'teams',
      badge: 'Teams',
      title: 'TEAMS',
      price: '12 €',
      period: '/mois',
      description: 'Espaces de connaissance partagés pour petits groupes.',
      features: [
        'Bibliothèque et mémoire partagées',
        '500 requêtes IA / siège',
        'Contrôles admin espace',
        'Recherche collaborative',
        'Flashcards et quiz',
        'Sync sur clients web',
      ],
      cta: 'Passer à Teams',
    },
    {
      code: 'pro_monthly',
      title: 'PRO (MENSUEL)',
      price: '20 €',
      period: '/mois',
      subPrice: 'ou 160 €/an (≈ 13,33 €/mois)',
      description: 'Tout illimité. Toutes les fonctionnalités.',
      features: [
        'Requêtes IA illimitées',
        'Chronologie de mémoire avancée',
        'Espace de recherche',
        'Routage modèle prioritaire',
        'Flashcards et quiz',
        'Mémoire à long terme',
      ],
      cta: 'Upgrade mensuel',
    },
    {
      code: 'pro_yearly',
      badge: 'Meilleur rapport',
      title: 'PRO (ANNUEL)',
      price: '160 €',
      period: '/an',
      subPrice: '≈ 13,33 €/mois • Économisez 80 €/an vs mensuel',
      description: 'Tout illimité. Toutes les fonctionnalités.',
      features: [
        'Toutes les fonctions Pro',
        'Coût annuel réduit',
        'Support prioritaire',
        'Mémoire à long terme',
        'Espace de recherche',
        'Base prête pour équipes',
      ],
      cta: 'Upgrade annuel',
      highlighted: true,
    },
  ],
  es: [
    {
      code: 'free',
      badge: 'Gratis',
      title: 'GRATIS',
      price: '$0',
      period: '/siempre',
      description: 'Empieza al instante. Sin tarjeta de crédito.',
      features: [
        '100 consultas IA incluidas',
        'Biblioteca y memoria básica',
        'Búsqueda básica',
        'Flashcards y cuestionarios',
        'Mejora cuando quieras',
      ],
      cta: 'Empezar gratis',
    },
    {
      code: 'teams',
      badge: 'Teams',
      title: 'TEAMS',
      price: '$12',
      period: '/mes',
      description: 'Espacios de conocimiento compartidos para grupos pequeños.',
      features: [
        'Biblioteca y memoria compartidas',
        '500 consultas IA / asiento',
        'Controles de admin del espacio',
        'Investigación colaborativa',
        'Flashcards y cuestionarios',
        'Sincroniza en clientes web',
      ],
      cta: 'Mejorar a Teams',
    },
    {
      code: 'pro_monthly',
      title: 'PRO (MENSUAL)',
      price: '$20',
      period: '/mes',
      subPrice: 'o $160/año (≈ $13.33/mes)',
      description: 'Todo ilimitado. Todas las funciones incluidas.',
      features: [
        'Consultas IA ilimitadas',
        'Línea de memoria avanzada',
        'Espacio de investigación',
        'Enrutamiento prioritario de modelos',
        'Flashcards y cuestionarios',
        'Memoria a largo plazo',
      ],
      cta: 'Mejorar mensual',
    },
    {
      code: 'pro_yearly',
      badge: 'Mejor valor',
      title: 'PRO (ANUAL)',
      price: '$160',
      period: '/año',
      subPrice: '≈ $13.33/mes • Ahorra $80/año vs mensual',
      description: 'Todo ilimitado. Todas las funciones incluidas.',
      features: [
        'Todas las funciones Pro',
        'Costo anual menor',
        'Soporte prioritario',
        'Memoria a largo plazo',
        'Espacio de investigación',
        'Base lista para equipos',
      ],
      cta: 'Mejorar anual',
      highlighted: true,
    },
  ],
  de: [
    {
      code: 'free',
      badge: 'Kostenlos',
      title: 'KOSTENLOS',
      price: '0 €',
      period: '/für immer',
      description: 'Sofort starten. Keine Kreditkarte nötig.',
      features: [
        '100 KI-Anfragen inklusive',
        'Kern-Bibliothek & Gedächtnis',
        'Basissuche',
        'Karteikarten & Quiz',
        'Jederzeit upgraden',
      ],
      cta: 'Kostenlos starten',
    },
    {
      code: 'teams',
      badge: 'Teams',
      title: 'TEAMS',
      price: '12 €',
      period: '/Mo.',
      description: 'Geteilte Wissens-Arbeitsbereiche für kleine Gruppen.',
      features: [
        'Geteilte Bibliothek & Gedächtnis',
        '500 KI-Anfragen / Sitz',
        'Admin-Steuerung Arbeitsbereich',
        'Kollaborative Forschung',
        'Karteikarten & Quiz',
        'Sync über Web-Clients',
      ],
      cta: 'Upgrade zu Teams',
    },
    {
      code: 'pro_monthly',
      title: 'PRO (MONATLICH)',
      price: '20 €',
      period: '/Mo.',
      subPrice: 'oder 160 €/Jahr (≈ 13,33 €/Mo.)',
      description: 'Alles unbegrenzt. Alle Funktionen inklusive.',
      features: [
        'Unbegrenzte KI-Anfragen',
        'Erweiterte Gedächtnis-Zeitleiste',
        'Forschungsarbeitsbereich',
        'Prioritäts-Modell-Routing',
        'Karteikarten & Quiz',
        'Langzeitgedächtnis',
      ],
      cta: 'Monatlich upgraden',
    },
    {
      code: 'pro_yearly',
      badge: 'Bester Wert',
      title: 'PRO (JÄHRLICH)',
      price: '160 €',
      period: '/Jahr',
      subPrice: '≈ 13,33 €/Mo. • Sparen Sie 80 €/Jahr vs monatlich',
      description: 'Alles unbegrenzt. Alle Funktionen inklusive.',
      features: [
        'Alle Pro-Funktionen',
        'Geringere Jahreskosten',
        'Prioritäts-Support',
        'Langzeitgedächtnis',
        'Forschungsarbeitsbereich',
        'Team-fähige Basis',
      ],
      cta: 'Jährlich upgraden',
      highlighted: true,
    },
  ],
  pt: [
    {
      code: 'free',
      badge: 'Grátis',
      title: 'GRÁTIS',
      price: 'R$ 0',
      period: '/sempre',
      description: 'Comece na hora. Sem cartão de crédito.',
      features: [
        '100 consultas IA incluídas',
        'Biblioteca e memória básica',
        'Busca básica',
        'Flashcards e questionários',
        'Upgrade quando quiser',
      ],
      cta: 'Começar grátis',
    },
    {
      code: 'teams',
      badge: 'Teams',
      title: 'TEAMS',
      price: 'R$ 12',
      period: '/mês',
      description: 'Espaços de conhecimento compartilhados para pequenos grupos.',
      features: [
        'Biblioteca e memória compartilhadas',
        '500 consultas IA / assento',
        'Controles admin do espaço',
        'Pesquisa colaborativa',
        'Flashcards e questionários',
        'Sincroniza em clientes web',
      ],
      cta: 'Upgrade para Teams',
    },
    {
      code: 'pro_monthly',
      title: 'PRO (MENSAL)',
      price: 'R$ 20',
      period: '/mês',
      subPrice: 'ou R$ 160/ano (≈ R$ 13,33/mês)',
      description: 'Tudo ilimitado. Todos os recursos incluídos.',
      features: [
        'Consultas IA ilimitadas',
        'Linha do tempo de memória avançada',
        'Espaço de pesquisa',
        'Roteamento prioritário de modelos',
        'Flashcards e questionários',
        'Memória de longo prazo',
      ],
      cta: 'Upgrade mensal',
    },
    {
      code: 'pro_yearly',
      badge: 'Melhor valor',
      title: 'PRO (ANUAL)',
      price: 'R$ 160',
      period: '/ano',
      subPrice: '≈ R$ 13,33/mês • Economize R$ 80/ano vs mensal',
      description: 'Tudo ilimitado. Todos os recursos incluídos.',
      features: [
        'Todos os recursos Pro',
        'Custo anual menor',
        'Suporte prioritário',
        'Memória de longo prazo',
        'Espaço de pesquisa',
        'Base pronta para equipes',
      ],
      cta: 'Upgrade anual',
      highlighted: true,
    },
  ],
};

export function getLocalizedPricingPlans(locale: LandingLocale): PricingPlan[] {
  return pricingPlansByLocale[locale] ?? pricingPlansByLocale.en;
}

export function getPlanCodeFromLocalizedPlans(
  plans: PricingPlan[],
  code: PlanCode,
): PricingPlan | undefined {
  return plans.find((plan) => plan.code === code);
}
