import type { LocaleDict } from '@/lib/i18n/config'

// Public landing surface. Keys are namespaced `landing.*`. French is the source
// of truth (copied verbatim from the components); the rest are translations.
export const landing: LocaleDict = {
  fr: {
    'landing.skipToContent': 'Aller au contenu',
    'landing.header.homeAria': 'PrivaDoc, accueil',
    'landing.nav.login': 'Se connecter',
    'landing.nav.signup': 'Créer un compte',
    'landing.cta.createFree': 'Créer un compte gratuit',

    'landing.hero.eyebrow': 'Pour les avocats, notaires et experts-comptables',
    'landing.hero.titleLead': 'Récupérez chaque pièce du dossier.',
    'landing.hero.titleAccent': 'Sans courir après personne.',
    'landing.hero.subtitle':
      'PrivaDoc dresse la liste des documents à fournir, votre client les dépose via un seul lien, et vous êtes prévenu à chaque réception. Vous suivez l’avancement de chaque dossier d’un coup d’œil.',
    'landing.hero.seeHow': 'Voir comment ça marche',
    'landing.hero.reassurance': 'Gratuit pour démarrer · Sans carte bancaire · Hébergé en Europe',
    'landing.hero.card.badge': 'Demande de pièces',
    'landing.hero.card.doc.id': "Pièce d'identité",
    'landing.hero.card.doc.taxNotice': "Dernier avis d'imposition",
    'landing.hero.card.doc.proofAddress': 'Justificatif de domicile',
    'landing.hero.card.doc.bankDetails': 'RIB',
    'landing.hero.card.received': 'Reçu',
    'landing.hero.card.pending': 'En attente',
    'landing.hero.card.progress': '2 pièces sur 4 reçues',

    'landing.pain.eyebrow': 'Le vrai problème',
    'landing.pain.title': "Le dossier n'attend pas. Les pièces, si.",
    'landing.pain.quote':
      '« Vous pouvez me renvoyer le justificatif ? Celui d’avant était illisible. »',
    'landing.pain.body1':
      'Un mail pour réclamer l’avis d’imposition. Un rappel trois jours plus tard. Un scan flou, un fichier nommé « document (2) », un RIB qui n’arrive jamais. Pendant ce temps l’échéance approche — et c’est encore vous qui relancez.',
    'landing.pain.body2':
      'Collecter des pièces n’est pas un problème de stockage. C’est un problème de suivi.',

    'landing.how.eyebrow': 'Comment ça marche',
    'landing.how.title': "Trois étapes. Ensuite, vous n'y pensez plus.",
    'landing.how.step1.title': 'Vous listez ce dont vous avez besoin',
    'landing.how.step1.body':
      "Créez une demande et cochez les pièces attendues — pièce d'identité, avis d'imposition, RIB… Une seule fois, pour tout le dossier.",
    'landing.how.step2.title': 'Votre client dépose en un lien',
    'landing.how.step2.body':
      'Il reçoit un lien unique. Aucun compte à créer, aucun mot de passe. Il voit ce qui reste à fournir et dépose depuis son téléphone ou son ordinateur.',
    'landing.how.step3.title': 'Vous êtes prévenu, tout est classé',
    'landing.how.step3.body':
      'À chaque dépôt, une notification. Chaque pièce arrive au bon endroit, nommée et rangée. Vous suivez l’avancement de tous vos dossiers depuis un tableau de bord.',

    'landing.benefits.eyebrow': 'Ce que vous y gagnez',
    'landing.benefits.title':
      'Ouvrez un compte, et le prochain dossier se remplit presque tout seul.',
    'landing.benefits.t1.title': 'Fini les relances',
    'landing.benefits.t1.body':
      'Le client voit en permanence ce qui manque, et les rappels partent automatiquement. Vous arrêtez de jouer les gardiens.',
    'landing.benefits.t2.title': 'Tous vos dossiers en un coup d’œil',
    'landing.benefits.t2.body':
      'Qui a répondu, qui est en retard, quelles échéances arrivent. Un seul tableau de bord.',
    'landing.benefits.t3.title': 'Pensé pour des clients pas informaticiens',
    'landing.benefits.t3.body':
      'Un lien, on dépose, terminé. Même le client le moins à l’aise y arrive du premier coup.',
    'landing.benefits.t4.title': 'Chaque pièce à sa place',
    'landing.benefits.t4.body':
      'Renommage, classement, historique. Le dossier est prêt quand vous en avez besoin.',
    'landing.benefits.free.title': 'Gratuit pour démarrer.',
    'landing.benefits.free.body':
      'Créez votre première demande en quelques minutes, sans carte bancaire.',

    'landing.trust.eyebrow': 'Confidentialité',
    'landing.trust.title': "Des documents sensibles méritent mieux qu'un dossier partagé.",
    'landing.trust.euFlagAria': 'Union européenne',
    'landing.trust.c1.label': 'Hébergé en Europe',
    'landing.trust.c1.body':
      'Vos données restent dans l’Union européenne, conformément au RGPD. Aucun transfert hors UE.',
    'landing.trust.c2.label': 'Chiffré et sous contrôle',
    'landing.trust.c2.body':
      'Liens de partage qui expirent, accès révocables à tout moment. Vous décidez qui voit quoi, et jusqu’à quand.',
    'landing.trust.c3.label': 'Jamais exploité',
    'landing.trust.c3.body':
      'Vos documents ne servent ni à la publicité, ni à entraîner une IA. Zéro pub.',

    'landing.comparison.eyebrow': 'Et par rapport à un simple Drive ?',
    'landing.comparison.title': 'Un Drive stocke. PrivaDoc collecte.',
    'landing.comparison.subtitle':
      "Google Drive est un excellent disque dur. Mais réclamer des pièces à des clients, ce n'est pas du stockage.",
    'landing.comparison.regionAria': 'Comparatif PrivaDoc et Google Drive',
    'landing.comparison.caption': 'Comparaison PrivaDoc vs Google Drive',
    'landing.comparison.no': 'Non',
    'landing.comparison.r1.criterion': 'Liste des pièces à fournir',
    'landing.comparison.r1.privadoc': 'Intégrée',
    'landing.comparison.r2.criterion': "Suivi de l'avancement",
    'landing.comparison.r2.privadoc': 'Tableau de bord',
    'landing.comparison.r2.drive': 'Vérification manuelle',
    'landing.comparison.r3.criterion': 'Notifications de dépôt',
    'landing.comparison.r3.privadoc': 'Automatiques',
    'landing.comparison.r3.drive': 'Aucune',
    'landing.comparison.r4.criterion': 'Simplicité côté client',
    'landing.comparison.r4.privadoc': 'Un lien, on dépose',
    'landing.comparison.r4.drive': 'Compte + permissions',
    'landing.comparison.r5.criterion': 'Hébergement & confidentialité',
    'landing.comparison.r5.privadoc': 'Europe · sans pub',
    'landing.comparison.r5.drive': 'Hors UE possible',

    'landing.finalCta.title': 'Votre prochain dossier peut commencer maintenant.',
    'landing.finalCta.body':
      'Créez votre première demande de pièces en quelques minutes. Gratuit pour démarrer, sans carte bancaire.',

    'landing.footer.tagline': 'PrivaDoc — la collecte de documents pensée pour les professionnels.',
    'landing.footer.legalNav': 'Liens légaux',
    'landing.footer.privacy': 'Confidentialité',
    'landing.footer.legal': 'Mentions légales',
    'landing.footer.europe': 'Hébergé en Europe · Conforme au RGPD',
  },
  es: {
    'landing.skipToContent': 'Ir al contenido',
    'landing.header.homeAria': 'PrivaDoc, inicio',
    'landing.nav.login': 'Iniciar sesión',
    'landing.nav.signup': 'Crear una cuenta',
    'landing.cta.createFree': 'Crear una cuenta gratis',

    'landing.hero.eyebrow': 'Para abogados, notarios y asesores fiscales',
    'landing.hero.titleLead': 'Reúne cada documento del expediente.',
    'landing.hero.titleAccent': 'Sin perseguir a nadie.',
    'landing.hero.subtitle':
      'PrivaDoc elabora la lista de documentos a aportar, tu cliente los sube mediante un único enlace y recibes un aviso en cada recepción. Sigues el avance de cada expediente de un vistazo.',
    'landing.hero.seeHow': 'Ver cómo funciona',
    'landing.hero.reassurance': 'Gratis para empezar · Sin tarjeta bancaria · Alojado en Europa',
    'landing.hero.card.badge': 'Solicitud de documentos',
    'landing.hero.card.doc.id': 'Documento de identidad',
    'landing.hero.card.doc.taxNotice': 'Última declaración de la renta',
    'landing.hero.card.doc.proofAddress': 'Justificante de domicilio',
    'landing.hero.card.doc.bankDetails': 'Datos bancarios',
    'landing.hero.card.received': 'Recibido',
    'landing.hero.card.pending': 'Pendiente',
    'landing.hero.card.progress': '2 de 4 documentos recibidos',

    'landing.pain.eyebrow': 'El verdadero problema',
    'landing.pain.title': 'El expediente no espera. Los documentos, sí.',
    'landing.pain.quote': '«¿Puedes reenviarme el justificante? El anterior era ilegible.»',
    'landing.pain.body1':
      'Un correo para reclamar la declaración de la renta. Un recordatorio tres días después. Un escaneo borroso, un archivo llamado «documento (2)», unos datos bancarios que nunca llegan. Mientras tanto el plazo se acerca — y sigues siendo tú quien insiste.',
    'landing.pain.body2':
      'Reunir documentos no es un problema de almacenamiento. Es un problema de seguimiento.',

    'landing.how.eyebrow': 'Cómo funciona',
    'landing.how.title': 'Tres pasos. Después, dejas de pensar en ello.',
    'landing.how.step1.title': 'Enumeras lo que necesitas',
    'landing.how.step1.body':
      'Crea una solicitud y marca los documentos esperados — documento de identidad, declaración de la renta, datos bancarios… Una sola vez, para todo el expediente.',
    'landing.how.step2.title': 'Tu cliente los sube con un enlace',
    'landing.how.step2.body':
      'Recibe un enlace único. Sin cuenta que crear, sin contraseña. Ve lo que falta por aportar y lo sube desde su teléfono o su ordenador.',
    'landing.how.step3.title': 'Recibes el aviso, todo queda ordenado',
    'landing.how.step3.body':
      'Con cada subida, una notificación. Cada documento llega al lugar correcto, nombrado y ordenado. Sigues el avance de todos tus expedientes desde un panel de control.',

    'landing.benefits.eyebrow': 'Lo que ganas',
    'landing.benefits.title': 'Abre una cuenta y el próximo expediente se completa casi solo.',
    'landing.benefits.t1.title': 'Se acabó insistir',
    'landing.benefits.t1.body':
      'El cliente ve en todo momento lo que falta, y los recordatorios salen de forma automática. Dejas de hacer de vigilante.',
    'landing.benefits.t2.title': 'Todos tus expedientes de un vistazo',
    'landing.benefits.t2.body':
      'Quién ha respondido, quién va con retraso, qué plazos se acercan. Un único panel de control.',
    'landing.benefits.t3.title': 'Pensado para clientes poco tecnológicos',
    'landing.benefits.t3.body':
      'Un enlace, se sube, listo. Incluso el cliente menos hábil lo consigue a la primera.',
    'landing.benefits.t4.title': 'Cada documento en su sitio',
    'landing.benefits.t4.body':
      'Renombrado, clasificación, historial. El expediente está listo cuando lo necesitas.',
    'landing.benefits.free.title': 'Gratis para empezar.',
    'landing.benefits.free.body':
      'Crea tu primera solicitud en unos minutos, sin tarjeta bancaria.',

    'landing.trust.eyebrow': 'Confidencialidad',
    'landing.trust.title': 'Los documentos sensibles merecen algo mejor que una carpeta compartida.',
    'landing.trust.euFlagAria': 'Unión Europea',
    'landing.trust.c1.label': 'Alojado en Europa',
    'landing.trust.c1.body':
      'Tus datos permanecen en la Unión Europea, conforme al RGPD. Sin transferencias fuera de la UE.',
    'landing.trust.c2.label': 'Cifrado y bajo control',
    'landing.trust.c2.body':
      'Enlaces de compartición que caducan, accesos revocables en cualquier momento. Tú decides quién ve qué, y hasta cuándo.',
    'landing.trust.c3.label': 'Nunca explotado',
    'landing.trust.c3.body':
      'Tus documentos no se usan para publicidad ni para entrenar una IA. Cero anuncios.',

    'landing.comparison.eyebrow': '¿Y frente a un simple Drive?',
    'landing.comparison.title': 'Un Drive almacena. PrivaDoc recopila.',
    'landing.comparison.subtitle':
      'Google Drive es un disco duro excelente. Pero reclamar documentos a los clientes no es almacenamiento.',
    'landing.comparison.regionAria': 'Comparativa PrivaDoc y Google Drive',
    'landing.comparison.caption': 'Comparación PrivaDoc frente a Google Drive',
    'landing.comparison.no': 'No',
    'landing.comparison.r1.criterion': 'Lista de documentos a aportar',
    'landing.comparison.r1.privadoc': 'Integrada',
    'landing.comparison.r2.criterion': 'Seguimiento del avance',
    'landing.comparison.r2.privadoc': 'Panel de control',
    'landing.comparison.r2.drive': 'Comprobación manual',
    'landing.comparison.r3.criterion': 'Notificaciones de subida',
    'landing.comparison.r3.privadoc': 'Automáticas',
    'landing.comparison.r3.drive': 'Ninguna',
    'landing.comparison.r4.criterion': 'Sencillez para el cliente',
    'landing.comparison.r4.privadoc': 'Un enlace y se sube',
    'landing.comparison.r4.drive': 'Cuenta + permisos',
    'landing.comparison.r5.criterion': 'Alojamiento y confidencialidad',
    'landing.comparison.r5.privadoc': 'Europa · sin anuncios',
    'landing.comparison.r5.drive': 'Posible fuera de la UE',

    'landing.finalCta.title': 'Tu próximo expediente puede empezar ahora.',
    'landing.finalCta.body':
      'Crea tu primera solicitud de documentos en unos minutos. Gratis para empezar, sin tarjeta bancaria.',

    'landing.footer.tagline': 'PrivaDoc — la recopilación de documentos pensada para profesionales.',
    'landing.footer.legalNav': 'Enlaces legales',
    'landing.footer.privacy': 'Privacidad',
    'landing.footer.legal': 'Aviso legal',
    'landing.footer.europe': 'Alojado en Europa · Conforme al RGPD',
  },
  en: {
    'landing.skipToContent': 'Skip to content',
    'landing.header.homeAria': 'PrivaDoc, home',
    'landing.nav.login': 'Sign in',
    'landing.nav.signup': 'Create an account',
    'landing.cta.createFree': 'Create a free account',

    'landing.hero.eyebrow': 'For lawyers, notaries and accountants',
    'landing.hero.titleLead': 'Collect every document in the file.',
    'landing.hero.titleAccent': 'Without chasing anyone.',
    'landing.hero.subtitle':
      'PrivaDoc draws up the list of documents to provide, your client uploads them through a single link, and you are notified on every receipt. You track the progress of each file at a glance.',
    'landing.hero.seeHow': 'See how it works',
    'landing.hero.reassurance': 'Free to start · No credit card · Hosted in Europe',
    'landing.hero.card.badge': 'Document request',
    'landing.hero.card.doc.id': 'Proof of identity',
    'landing.hero.card.doc.taxNotice': 'Latest tax return',
    'landing.hero.card.doc.proofAddress': 'Proof of address',
    'landing.hero.card.doc.bankDetails': 'Bank details',
    'landing.hero.card.received': 'Received',
    'landing.hero.card.pending': 'Pending',
    'landing.hero.card.progress': '2 of 4 documents received',

    'landing.pain.eyebrow': 'The real problem',
    'landing.pain.title': "The file won't wait. The documents will.",
    'landing.pain.quote': '“Could you resend the receipt? The last one was unreadable.”',
    'landing.pain.body1':
      'An email to ask for the tax return. A reminder three days later. A blurry scan, a file named “document (2)”, bank details that never arrive. Meanwhile the deadline looms — and it is still you doing the chasing.',
    'landing.pain.body2':
      'Collecting documents is not a storage problem. It is a tracking problem.',

    'landing.how.eyebrow': 'How it works',
    'landing.how.title': 'Three steps. After that, you stop thinking about it.',
    'landing.how.step1.title': 'You list what you need',
    'landing.how.step1.body':
      'Create a request and tick the expected documents — proof of identity, tax return, bank details… Once, for the whole file.',
    'landing.how.step2.title': 'Your client uploads with one link',
    'landing.how.step2.body':
      'They receive a single link. No account to create, no password. They see what is still missing and upload from their phone or computer.',
    'landing.how.step3.title': 'You are notified, everything is sorted',
    'landing.how.step3.body':
      'With every upload, a notification. Each document lands in the right place, named and filed. You track the progress of all your files from a dashboard.',

    'landing.benefits.eyebrow': 'What you gain',
    'landing.benefits.title': 'Open an account, and the next file fills itself in almost on its own.',
    'landing.benefits.t1.title': 'No more chasing',
    'landing.benefits.t1.body':
      'The client always sees what is missing, and reminders go out automatically. You stop playing gatekeeper.',
    'landing.benefits.t2.title': 'All your files at a glance',
    'landing.benefits.t2.body':
      'Who has replied, who is behind, which deadlines are coming. A single dashboard.',
    'landing.benefits.t3.title': 'Built for clients who are not tech-savvy',
    'landing.benefits.t3.body':
      'One link, upload, done. Even the least comfortable client gets it right the first time.',
    'landing.benefits.t4.title': 'Every document in its place',
    'landing.benefits.t4.body': 'Renaming, filing, history. The file is ready when you need it.',
    'landing.benefits.free.title': 'Free to start.',
    'landing.benefits.free.body': 'Create your first request in a few minutes, no credit card.',

    'landing.trust.eyebrow': 'Confidentiality',
    'landing.trust.title': 'Sensitive documents deserve better than a shared folder.',
    'landing.trust.euFlagAria': 'European Union',
    'landing.trust.c1.label': 'Hosted in Europe',
    'landing.trust.c1.body':
      'Your data stays within the European Union, in line with the GDPR. No transfer outside the EU.',
    'landing.trust.c2.label': 'Encrypted and under control',
    'landing.trust.c2.body':
      'Share links that expire, access revocable at any time. You decide who sees what, and for how long.',
    'landing.trust.c3.label': 'Never exploited',
    'landing.trust.c3.body':
      'Your documents are used neither for advertising nor to train an AI. Zero ads.',

    'landing.comparison.eyebrow': 'And compared to a plain Drive?',
    'landing.comparison.title': 'A Drive stores. PrivaDoc collects.',
    'landing.comparison.subtitle':
      'Google Drive is an excellent hard drive. But requesting documents from clients is not storage.',
    'landing.comparison.regionAria': 'PrivaDoc and Google Drive comparison',
    'landing.comparison.caption': 'PrivaDoc vs Google Drive comparison',
    'landing.comparison.no': 'No',
    'landing.comparison.r1.criterion': 'List of documents to provide',
    'landing.comparison.r1.privadoc': 'Built in',
    'landing.comparison.r2.criterion': 'Progress tracking',
    'landing.comparison.r2.privadoc': 'Dashboard',
    'landing.comparison.r2.drive': 'Manual check',
    'landing.comparison.r3.criterion': 'Upload notifications',
    'landing.comparison.r3.privadoc': 'Automatic',
    'landing.comparison.r3.drive': 'None',
    'landing.comparison.r4.criterion': 'Simplicity for the client',
    'landing.comparison.r4.privadoc': 'One link, just upload',
    'landing.comparison.r4.drive': 'Account + permissions',
    'landing.comparison.r5.criterion': 'Hosting & confidentiality',
    'landing.comparison.r5.privadoc': 'Europe · ad-free',
    'landing.comparison.r5.drive': 'Outside EU possible',

    'landing.finalCta.title': 'Your next file can start right now.',
    'landing.finalCta.body':
      'Create your first document request in a few minutes. Free to start, no credit card.',

    'landing.footer.tagline': 'PrivaDoc — document collection designed for professionals.',
    'landing.footer.legalNav': 'Legal links',
    'landing.footer.privacy': 'Privacy',
    'landing.footer.legal': 'Legal notice',
    'landing.footer.europe': 'Hosted in Europe · GDPR compliant',
  },
  de: {
    'landing.skipToContent': 'Zum Inhalt springen',
    'landing.header.homeAria': 'PrivaDoc, Startseite',
    'landing.nav.login': 'Anmelden',
    'landing.nav.signup': 'Konto erstellen',
    'landing.cta.createFree': 'Kostenloses Konto erstellen',

    'landing.hero.eyebrow': 'Für Anwälte, Notare und Steuerberater',
    'landing.hero.titleLead': 'Sammeln Sie jedes Dokument der Akte.',
    'landing.hero.titleAccent': 'Ohne jemandem hinterherzulaufen.',
    'landing.hero.subtitle':
      'PrivaDoc erstellt die Liste der einzureichenden Dokumente, Ihr Mandant lädt sie über einen einzigen Link hoch, und Sie werden bei jedem Eingang benachrichtigt. Den Fortschritt jeder Akte sehen Sie auf einen Blick.',
    'landing.hero.seeHow': 'Sehen, wie es funktioniert',
    'landing.hero.reassurance': 'Kostenlos starten · Ohne Kreditkarte · In Europa gehostet',
    'landing.hero.card.badge': 'Dokumentenanforderung',
    'landing.hero.card.doc.id': 'Ausweisdokument',
    'landing.hero.card.doc.taxNotice': 'Letzter Steuerbescheid',
    'landing.hero.card.doc.proofAddress': 'Adressnachweis',
    'landing.hero.card.doc.bankDetails': 'Bankverbindung',
    'landing.hero.card.received': 'Erhalten',
    'landing.hero.card.pending': 'Ausstehend',
    'landing.hero.card.progress': '2 von 4 Dokumenten erhalten',

    'landing.pain.eyebrow': 'Das eigentliche Problem',
    'landing.pain.title': 'Die Akte wartet nicht. Die Dokumente schon.',
    'landing.pain.quote':
      '„Können Sie mir den Nachweis noch einmal schicken? Der letzte war unlesbar.“',
    'landing.pain.body1':
      'Eine E-Mail, um den Steuerbescheid anzufordern. Eine Erinnerung drei Tage später. Ein unscharfer Scan, eine Datei namens „Dokument (2)“, eine Bankverbindung, die nie ankommt. Währenddessen rückt die Frist näher — und wieder sind Sie es, der nachhakt.',
    'landing.pain.body2':
      'Dokumente zu sammeln ist kein Speicherproblem. Es ist ein Nachverfolgungsproblem.',

    'landing.how.eyebrow': 'So funktioniert es',
    'landing.how.title': 'Drei Schritte. Danach denken Sie nicht mehr daran.',
    'landing.how.step1.title': 'Sie listen auf, was Sie brauchen',
    'landing.how.step1.body':
      'Erstellen Sie eine Anfrage und haken Sie die erwarteten Dokumente ab — Ausweis, Steuerbescheid, Bankverbindung… Einmal, für die gesamte Akte.',
    'landing.how.step2.title': 'Ihr Mandant lädt über einen Link hoch',
    'landing.how.step2.body':
      'Er erhält einen einzigen Link. Kein Konto anzulegen, kein Passwort. Er sieht, was noch fehlt, und lädt es von seinem Telefon oder Computer hoch.',
    'landing.how.step3.title': 'Sie werden benachrichtigt, alles ist abgelegt',
    'landing.how.step3.body':
      'Bei jedem Upload eine Benachrichtigung. Jedes Dokument landet am richtigen Ort, benannt und einsortiert. Den Fortschritt aller Akten verfolgen Sie über ein Dashboard.',

    'landing.benefits.eyebrow': 'Was Sie gewinnen',
    'landing.benefits.title':
      'Erstellen Sie ein Konto, und die nächste Akte füllt sich fast von selbst.',
    'landing.benefits.t1.title': 'Schluss mit dem Nachhaken',
    'landing.benefits.t1.body':
      'Der Mandant sieht jederzeit, was fehlt, und Erinnerungen gehen automatisch raus. Sie spielen nicht länger den Aufpasser.',
    'landing.benefits.t2.title': 'Alle Akten auf einen Blick',
    'landing.benefits.t2.body':
      'Wer geantwortet hat, wer im Verzug ist, welche Fristen anstehen. Ein einziges Dashboard.',
    'landing.benefits.t3.title': 'Gedacht für wenig technikaffine Mandanten',
    'landing.benefits.t3.body':
      'Ein Link, hochladen, fertig. Selbst der ungeübteste Mandant schafft es auf Anhieb.',
    'landing.benefits.t4.title': 'Jedes Dokument an seinem Platz',
    'landing.benefits.t4.body':
      'Umbenennen, Ablage, Verlauf. Die Akte ist bereit, wenn Sie sie brauchen.',
    'landing.benefits.free.title': 'Kostenlos starten.',
    'landing.benefits.free.body':
      'Erstellen Sie Ihre erste Anfrage in wenigen Minuten, ohne Kreditkarte.',

    'landing.trust.eyebrow': 'Vertraulichkeit',
    'landing.trust.title': 'Sensible Dokumente verdienen mehr als einen geteilten Ordner.',
    'landing.trust.euFlagAria': 'Europäische Union',
    'landing.trust.c1.label': 'In Europa gehostet',
    'landing.trust.c1.body':
      'Ihre Daten bleiben in der Europäischen Union, im Einklang mit der DSGVO. Keine Übertragung außerhalb der EU.',
    'landing.trust.c2.label': 'Verschlüsselt und unter Kontrolle',
    'landing.trust.c2.body':
      'Freigabelinks, die ablaufen, jederzeit widerrufbare Zugriffe. Sie entscheiden, wer was sieht und bis wann.',
    'landing.trust.c3.label': 'Niemals ausgewertet',
    'landing.trust.c3.body':
      'Ihre Dokumente dienen weder der Werbung noch dem Training einer KI. Null Werbung.',

    'landing.comparison.eyebrow': 'Und im Vergleich zu einem einfachen Drive?',
    'landing.comparison.title': 'Ein Drive speichert. PrivaDoc sammelt.',
    'landing.comparison.subtitle':
      'Google Drive ist eine hervorragende Festplatte. Aber Dokumente von Mandanten anzufordern ist keine Speicherung.',
    'landing.comparison.regionAria': 'Vergleich PrivaDoc und Google Drive',
    'landing.comparison.caption': 'Vergleich PrivaDoc gegenüber Google Drive',
    'landing.comparison.no': 'Nein',
    'landing.comparison.r1.criterion': 'Liste der einzureichenden Dokumente',
    'landing.comparison.r1.privadoc': 'Integriert',
    'landing.comparison.r2.criterion': 'Fortschrittsverfolgung',
    'landing.comparison.r2.privadoc': 'Dashboard',
    'landing.comparison.r2.drive': 'Manuelle Prüfung',
    'landing.comparison.r3.criterion': 'Upload-Benachrichtigungen',
    'landing.comparison.r3.privadoc': 'Automatisch',
    'landing.comparison.r3.drive': 'Keine',
    'landing.comparison.r4.criterion': 'Einfachheit für den Mandanten',
    'landing.comparison.r4.privadoc': 'Ein Link, einfach hochladen',
    'landing.comparison.r4.drive': 'Konto + Berechtigungen',
    'landing.comparison.r5.criterion': 'Hosting & Vertraulichkeit',
    'landing.comparison.r5.privadoc': 'Europa · werbefrei',
    'landing.comparison.r5.drive': 'Außerhalb der EU möglich',

    'landing.finalCta.title': 'Ihre nächste Akte kann jetzt beginnen.',
    'landing.finalCta.body':
      'Erstellen Sie Ihre erste Dokumentenanforderung in wenigen Minuten. Kostenlos starten, ohne Kreditkarte.',

    'landing.footer.tagline': 'PrivaDoc — die Dokumentensammlung, gedacht für Profis.',
    'landing.footer.legalNav': 'Rechtliche Links',
    'landing.footer.privacy': 'Datenschutz',
    'landing.footer.legal': 'Impressum',
    'landing.footer.europe': 'In Europa gehostet · DSGVO-konform',
  },
}
