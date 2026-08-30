import type { LocaleDict } from '@/lib/i18n/config'

// Professional space surface (dashboard, requests, clients, request detail,
// onboarding/pending screens, and the new-request form). Keys are namespaced
// `pro.*`. Dynamic user content (client names/emails, request/document titles,
// dates) is NOT translated.
export const pro: LocaleDict = {
  fr: {
    // Common (reused across pro pages)
    'pro.common.newRequest': 'Nouvelle demande',
    'pro.common.seeAll': 'Voir tout',
    'pro.common.open': 'Ouvrir',
    'pro.common.delete': 'Supprimer',
    'pro.common.toReviewCount': '{count} à valider',

    // StatusBadge (platform-ui.tsx)
    'pro.status.item.pending': 'En attente',
    'pro.status.item.submitted': 'À valider',
    'pro.status.item.validated': 'Validée',
    'pro.status.item.rejected': 'À refaire',
    'pro.status.request.open': 'En cours',
    'pro.status.request.completed': 'Terminée',
    'pro.status.request.archived': 'Archivée',

    // Pending-validation screen (pro/page.tsx)
    'pro.pending.title': 'Demande en cours de validation',
    'pro.pending.body':
      "Votre compte professionnel est en attente d'approbation par un administrateur. Vous recevrez un email dès qu'il sera activé.",

    // Onboarding (become-pro form, pro/page.tsx)
    'pro.onboarding.title': 'Espace professionnel',
    'pro.onboarding.body':
      'Demandez des pièces à vos clients, suivez leurs dépôts et validez chaque document en un seul endroit. Créez votre compte professionnel — il sera activé après validation par un administrateur.',
    'pro.onboarding.nameLabel': 'Nom ou cabinet',
    'pro.onboarding.namePlaceholder': 'Maître Dupont — Cabinet Dupont & Associés',
    'pro.onboarding.professionLabel': 'Profession',
    'pro.onboarding.professionPlaceholder': '— Choisir dans la liste —',
    'pro.onboarding.customProfessionPlaceholder':
      'Ou saisissez votre profession si absente de la liste',
    'pro.onboarding.submit': 'Créer un compte professionnel',

    // Dashboard (pro/page.tsx)
    'pro.dashboard.title': 'Tableau de bord',
    'pro.dashboard.subtitle': "Suivez vos clients et l'avancement de leurs dossiers.",
    'pro.dashboard.statActiveClients': 'Clients actifs',
    'pro.dashboard.statOpenCount': 'Dossiers en cours',
    'pro.dashboard.statToReview': 'Pièces à valider',
    'pro.dashboard.statCompletionRate': 'Taux de complétion',
    'pro.dashboard.statOverdue': 'Retards',
    'pro.dashboard.toReviewTitle': 'À valider',
    'pro.dashboard.review': 'Examiner',
    'pro.dashboard.deadlinesTitle': 'Échéances à venir',
    'pro.dashboard.deadlinesEmpty': 'Aucune échéance à venir. Tout est à jour.',
    'pro.dashboard.overduePrefix': 'En retard · ',
    'pro.dashboard.sharedTitle': 'Partagé avec moi',
    'pro.dashboard.sharedBy': 'Partagé par {name} · ',
    'pro.dashboard.clientsTitle': 'Clients',
    'pro.dashboard.createRequestCta': 'Créer une demande',
    'pro.dashboard.noRequestsBody':
      "Aucune demande pour l'instant. Créez une demande de pièces pour un client afin de suivre ses dépôts ici.",

    // Requests list (demandes/page.tsx)
    'pro.requests.title': 'Demandes',
    'pro.requests.subtitle': "Suivez l'avancement de chaque dossier.",
    'pro.requests.filterAria': 'Filtrer par statut',
    'pro.requests.filter.open': 'En cours',
    'pro.requests.filter.completed': 'Terminées',
    'pro.requests.filter.archived': 'Archivées',
    'pro.requests.filter.all': 'Toutes',
    'pro.requests.emptyAll':
      "Aucune demande pour l'instant. Créez une demande de pièces pour un client.",
    'pro.requests.emptyFiltered': 'Aucune demande avec ce statut.',
    'pro.requests.progressLabel': '{validated}/{total} validées',

    // Clients (clients/page.tsx)
    'pro.clients.title': 'Clients',
    'pro.clients.subtitle': "Vos clients et l'avancement de leurs dossiers.",
    'pro.clients.empty':
      "Aucun client pour l'instant. Créez une première demande pour ajouter un client.",
    'pro.clients.openCount': '{count} en cours',

    // New request page (nouvelle-demande/page.tsx)
    'pro.newRequestPage.subtitle':
      'Demandez des pièces à un client — il recevra un email et une notification.',

    // New request form (nouvelle-demande/new-request-form.tsx)
    'pro.form.clientName': 'Nom du client',
    'pro.form.clientNamePlaceholder': 'Ex. Lina Bernard',
    'pro.form.clientEmail': 'Adresse email du client',
    'pro.form.clientEmailPlaceholder': 'client@exemple.fr',
    'pro.form.title': 'Titre de la demande',
    'pro.form.titlePlaceholder': 'Dossier de prêt immobilier',
    'pro.form.itemsLegend': 'Pièces à fournir',
    'pro.form.itemsHint': 'Le client déposera un document pour chaque pièce listée ci-dessous.',
    'pro.form.itemLabel': 'Pièce {index}',
    'pro.form.removeItem': 'Retirer cette pièce',
    'pro.form.itemNameLabel': 'Nom de la pièce',
    'pro.form.itemNamePlaceholder': "Ex. Dernier avis d'imposition",
    'pro.form.dueDateLabel': 'Échéance',
    'pro.form.optional': '(facultatif)',
    'pro.form.addItem': '+ Ajouter une pièce',
    'pro.form.viewRequests': 'Voir mes demandes',
    'pro.form.submit': 'Créer la demande',
    'pro.form.submitPending': 'Création…',

    // Request detail (pro/[requestId]/page.tsx)
    'pro.detail.breadcrumbAria': "Fil d'Ariane",
    'pro.detail.clientLabel': 'Client : {email}',
    'pro.detail.status.pending': 'En attente',
    'pro.detail.status.submitted': 'Reçue',
    'pro.detail.status.validated': 'Validée',
    'pro.detail.status.rejected': 'Refusée',
    'pro.detail.dueDate': 'Échéance : {date}',
    'pro.detail.comment': 'Commentaire : {comment}',
    'pro.detail.commentPlaceholder': 'Commentaire (optionnel)',
    'pro.detail.validate': 'Valider',
    'pro.detail.reject': 'Refuser',
    'pro.detail.awaitingUpload': 'En attente du dépôt par le client.',
  },
  es: {
    // Common
    'pro.common.newRequest': 'Nueva solicitud',
    'pro.common.seeAll': 'Ver todo',
    'pro.common.open': 'Abrir',
    'pro.common.delete': 'Eliminar',
    'pro.common.toReviewCount': '{count} por validar',

    // StatusBadge
    'pro.status.item.pending': 'Pendiente',
    'pro.status.item.submitted': 'Por validar',
    'pro.status.item.validated': 'Validada',
    'pro.status.item.rejected': 'Por rehacer',
    'pro.status.request.open': 'En curso',
    'pro.status.request.completed': 'Terminada',
    'pro.status.request.archived': 'Archivada',

    // Pending-validation screen
    'pro.pending.title': 'Solicitud en curso de validación',
    'pro.pending.body':
      'Tu cuenta profesional está pendiente de aprobación por un administrador. Recibirás un correo en cuanto esté activada.',

    // Onboarding
    'pro.onboarding.title': 'Espacio profesional',
    'pro.onboarding.body':
      'Solicita documentos a tus clientes, sigue sus envíos y valida cada documento en un solo lugar. Crea tu cuenta profesional — se activará tras la validación de un administrador.',
    'pro.onboarding.nameLabel': 'Nombre o despacho',
    'pro.onboarding.namePlaceholder': 'Maestro Dupont — Despacho Dupont & Asociados',
    'pro.onboarding.professionLabel': 'Profesión',
    'pro.onboarding.professionPlaceholder': '— Elegir de la lista —',
    'pro.onboarding.customProfessionPlaceholder':
      'O escribe tu profesión si no aparece en la lista',
    'pro.onboarding.submit': 'Crear una cuenta profesional',

    // Dashboard
    'pro.dashboard.title': 'Panel de control',
    'pro.dashboard.subtitle': 'Sigue a tus clientes y el avance de sus expedientes.',
    'pro.dashboard.statActiveClients': 'Clientes activos',
    'pro.dashboard.statOpenCount': 'Expedientes en curso',
    'pro.dashboard.statToReview': 'Documentos por validar',
    'pro.dashboard.statCompletionRate': 'Tasa de finalización',
    'pro.dashboard.statOverdue': 'Retrasos',
    'pro.dashboard.toReviewTitle': 'Por validar',
    'pro.dashboard.review': 'Examinar',
    'pro.dashboard.deadlinesTitle': 'Próximos vencimientos',
    'pro.dashboard.deadlinesEmpty': 'No hay vencimientos próximos. Todo está al día.',
    'pro.dashboard.overduePrefix': 'Atrasado · ',
    'pro.dashboard.sharedTitle': 'Compartido conmigo',
    'pro.dashboard.sharedBy': 'Compartido por {name} · ',
    'pro.dashboard.clientsTitle': 'Clientes',
    'pro.dashboard.createRequestCta': 'Crear una solicitud',
    'pro.dashboard.noRequestsBody':
      'Aún no hay solicitudes. Crea una solicitud de documentos para un cliente y así podrás seguir sus envíos aquí.',

    // Requests list
    'pro.requests.title': 'Solicitudes',
    'pro.requests.subtitle': 'Sigue el avance de cada expediente.',
    'pro.requests.filterAria': 'Filtrar por estado',
    'pro.requests.filter.open': 'En curso',
    'pro.requests.filter.completed': 'Terminadas',
    'pro.requests.filter.archived': 'Archivadas',
    'pro.requests.filter.all': 'Todas',
    'pro.requests.emptyAll':
      'Aún no hay solicitudes. Crea una solicitud de documentos para un cliente.',
    'pro.requests.emptyFiltered': 'No hay solicitudes con este estado.',
    'pro.requests.progressLabel': '{validated}/{total} validadas',

    // Clients
    'pro.clients.title': 'Clientes',
    'pro.clients.subtitle': 'Tus clientes y el avance de sus expedientes.',
    'pro.clients.empty':
      'Aún no hay clientes. Crea una primera solicitud para añadir un cliente.',
    'pro.clients.openCount': '{count} en curso',

    // New request page
    'pro.newRequestPage.subtitle':
      'Solicita documentos a un cliente — recibirá un correo y una notificación.',

    // New request form
    'pro.form.clientName': 'Nombre del cliente',
    'pro.form.clientNamePlaceholder': 'Ej. Lina Bernard',
    'pro.form.clientEmail': 'Correo electrónico del cliente',
    'pro.form.clientEmailPlaceholder': 'cliente@ejemplo.es',
    'pro.form.title': 'Título de la solicitud',
    'pro.form.titlePlaceholder': 'Expediente de préstamo hipotecario',
    'pro.form.itemsLegend': 'Documentos a proporcionar',
    'pro.form.itemsHint': 'El cliente subirá un documento por cada elemento de la lista.',
    'pro.form.itemLabel': 'Documento {index}',
    'pro.form.removeItem': 'Quitar este documento',
    'pro.form.itemNameLabel': 'Nombre del documento',
    'pro.form.itemNamePlaceholder': 'Ej. Última declaración de impuestos',
    'pro.form.dueDateLabel': 'Vencimiento',
    'pro.form.optional': '(opcional)',
    'pro.form.addItem': '+ Añadir un documento',
    'pro.form.viewRequests': 'Ver mis solicitudes',
    'pro.form.submit': 'Crear la solicitud',
    'pro.form.submitPending': 'Creando…',

    // Request detail
    'pro.detail.breadcrumbAria': 'Ruta de navegación',
    'pro.detail.clientLabel': 'Cliente: {email}',
    'pro.detail.status.pending': 'Pendiente',
    'pro.detail.status.submitted': 'Recibida',
    'pro.detail.status.validated': 'Validada',
    'pro.detail.status.rejected': 'Rechazada',
    'pro.detail.dueDate': 'Vencimiento: {date}',
    'pro.detail.comment': 'Comentario: {comment}',
    'pro.detail.commentPlaceholder': 'Comentario (opcional)',
    'pro.detail.validate': 'Validar',
    'pro.detail.reject': 'Rechazar',
    'pro.detail.awaitingUpload': 'Esperando el envío del cliente.',
  },
  en: {
    // Common
    'pro.common.newRequest': 'New request',
    'pro.common.seeAll': 'See all',
    'pro.common.open': 'Open',
    'pro.common.delete': 'Delete',
    'pro.common.toReviewCount': '{count} to review',

    // StatusBadge
    'pro.status.item.pending': 'Pending',
    'pro.status.item.submitted': 'To review',
    'pro.status.item.validated': 'Validated',
    'pro.status.item.rejected': 'To redo',
    'pro.status.request.open': 'In progress',
    'pro.status.request.completed': 'Completed',
    'pro.status.request.archived': 'Archived',

    // Pending-validation screen
    'pro.pending.title': 'Request pending validation',
    'pro.pending.body':
      'Your professional account is awaiting approval by an administrator. You will receive an email as soon as it is activated.',

    // Onboarding
    'pro.onboarding.title': 'Professional space',
    'pro.onboarding.body':
      'Request documents from your clients, track their uploads, and validate each document in one place. Create your professional account — it will be activated after validation by an administrator.',
    'pro.onboarding.nameLabel': 'Name or firm',
    'pro.onboarding.namePlaceholder': 'Mr. Dupont — Dupont & Associates Firm',
    'pro.onboarding.professionLabel': 'Profession',
    'pro.onboarding.professionPlaceholder': '— Choose from the list —',
    'pro.onboarding.customProfessionPlaceholder': 'Or enter your profession if not in the list',
    'pro.onboarding.submit': 'Create a professional account',

    // Dashboard
    'pro.dashboard.title': 'Dashboard',
    'pro.dashboard.subtitle': 'Track your clients and the progress of their cases.',
    'pro.dashboard.statActiveClients': 'Active clients',
    'pro.dashboard.statOpenCount': 'Open cases',
    'pro.dashboard.statToReview': 'Documents to review',
    'pro.dashboard.statCompletionRate': 'Completion rate',
    'pro.dashboard.statOverdue': 'Overdue',
    'pro.dashboard.toReviewTitle': 'To review',
    'pro.dashboard.review': 'Review',
    'pro.dashboard.deadlinesTitle': 'Upcoming deadlines',
    'pro.dashboard.deadlinesEmpty': 'No upcoming deadlines. Everything is up to date.',
    'pro.dashboard.overduePrefix': 'Overdue · ',
    'pro.dashboard.sharedTitle': 'Shared with me',
    'pro.dashboard.sharedBy': 'Shared by {name} · ',
    'pro.dashboard.clientsTitle': 'Clients',
    'pro.dashboard.createRequestCta': 'Create a request',
    'pro.dashboard.noRequestsBody':
      'No requests yet. Create a document request for a client to track their uploads here.',

    // Requests list
    'pro.requests.title': 'Requests',
    'pro.requests.subtitle': 'Track the progress of each case.',
    'pro.requests.filterAria': 'Filter by status',
    'pro.requests.filter.open': 'In progress',
    'pro.requests.filter.completed': 'Completed',
    'pro.requests.filter.archived': 'Archived',
    'pro.requests.filter.all': 'All',
    'pro.requests.emptyAll': 'No requests yet. Create a document request for a client.',
    'pro.requests.emptyFiltered': 'No requests with this status.',
    'pro.requests.progressLabel': '{validated}/{total} validated',

    // Clients
    'pro.clients.title': 'Clients',
    'pro.clients.subtitle': 'Your clients and the progress of their cases.',
    'pro.clients.empty': 'No clients yet. Create a first request to add a client.',
    'pro.clients.openCount': '{count} in progress',

    // New request page
    'pro.newRequestPage.subtitle':
      'Request documents from a client — they will receive an email and a notification.',

    // New request form
    'pro.form.clientName': 'Client name',
    'pro.form.clientNamePlaceholder': 'E.g. Lina Bernard',
    'pro.form.clientEmail': "Client's email address",
    'pro.form.clientEmailPlaceholder': 'client@example.com',
    'pro.form.title': 'Request title',
    'pro.form.titlePlaceholder': 'Mortgage loan file',
    'pro.form.itemsLegend': 'Documents to provide',
    'pro.form.itemsHint': 'The client will upload one document for each item listed below.',
    'pro.form.itemLabel': 'Item {index}',
    'pro.form.removeItem': 'Remove this item',
    'pro.form.itemNameLabel': 'Item name',
    'pro.form.itemNamePlaceholder': 'E.g. Latest tax notice',
    'pro.form.dueDateLabel': 'Due date',
    'pro.form.optional': '(optional)',
    'pro.form.addItem': '+ Add an item',
    'pro.form.viewRequests': 'View my requests',
    'pro.form.submit': 'Create the request',
    'pro.form.submitPending': 'Creating…',

    // Request detail
    'pro.detail.breadcrumbAria': 'Breadcrumb',
    'pro.detail.clientLabel': 'Client: {email}',
    'pro.detail.status.pending': 'Pending',
    'pro.detail.status.submitted': 'Received',
    'pro.detail.status.validated': 'Validated',
    'pro.detail.status.rejected': 'Rejected',
    'pro.detail.dueDate': 'Due date: {date}',
    'pro.detail.comment': 'Comment: {comment}',
    'pro.detail.commentPlaceholder': 'Comment (optional)',
    'pro.detail.validate': 'Validate',
    'pro.detail.reject': 'Reject',
    'pro.detail.awaitingUpload': 'Awaiting upload from the client.',
  },
  de: {
    // Common
    'pro.common.newRequest': 'Neue Anfrage',
    'pro.common.seeAll': 'Alle anzeigen',
    'pro.common.open': 'Öffnen',
    'pro.common.delete': 'Löschen',
    'pro.common.toReviewCount': '{count} zu prüfen',

    // StatusBadge
    'pro.status.item.pending': 'Ausstehend',
    'pro.status.item.submitted': 'Zu prüfen',
    'pro.status.item.validated': 'Validiert',
    'pro.status.item.rejected': 'Zu wiederholen',
    'pro.status.request.open': 'Laufend',
    'pro.status.request.completed': 'Abgeschlossen',
    'pro.status.request.archived': 'Archiviert',

    // Pending-validation screen
    'pro.pending.title': 'Anfrage wird geprüft',
    'pro.pending.body':
      'Dein Profikonto wartet auf die Genehmigung durch einen Administrator. Du erhältst eine E-Mail, sobald es aktiviert ist.',

    // Onboarding
    'pro.onboarding.title': 'Profi-Bereich',
    'pro.onboarding.body':
      'Fordere Unterlagen von deinen Kunden an, verfolge deren Uploads und validiere jedes Dokument an einem Ort. Erstelle dein Profikonto — es wird nach Prüfung durch einen Administrator aktiviert.',
    'pro.onboarding.nameLabel': 'Name oder Kanzlei',
    'pro.onboarding.namePlaceholder': 'Herr Dupont — Kanzlei Dupont & Partner',
    'pro.onboarding.professionLabel': 'Beruf',
    'pro.onboarding.professionPlaceholder': '— Aus der Liste wählen —',
    'pro.onboarding.customProfessionPlaceholder':
      'Oder gib deinen Beruf ein, falls er nicht in der Liste steht',
    'pro.onboarding.submit': 'Profikonto erstellen',

    // Dashboard
    'pro.dashboard.title': 'Übersicht',
    'pro.dashboard.subtitle': 'Verfolge deine Kunden und den Fortschritt ihrer Vorgänge.',
    'pro.dashboard.statActiveClients': 'Aktive Kunden',
    'pro.dashboard.statOpenCount': 'Laufende Vorgänge',
    'pro.dashboard.statToReview': 'Zu prüfende Unterlagen',
    'pro.dashboard.statCompletionRate': 'Abschlussquote',
    'pro.dashboard.statOverdue': 'Verzögerungen',
    'pro.dashboard.toReviewTitle': 'Zu prüfen',
    'pro.dashboard.review': 'Prüfen',
    'pro.dashboard.deadlinesTitle': 'Anstehende Fristen',
    'pro.dashboard.deadlinesEmpty': 'Keine anstehenden Fristen. Alles ist auf dem neuesten Stand.',
    'pro.dashboard.overduePrefix': 'Überfällig · ',
    'pro.dashboard.sharedTitle': 'Mit mir geteilt',
    'pro.dashboard.sharedBy': 'Geteilt von {name} · ',
    'pro.dashboard.clientsTitle': 'Kunden',
    'pro.dashboard.createRequestCta': 'Anfrage erstellen',
    'pro.dashboard.noRequestsBody':
      'Noch keine Anfragen. Erstelle eine Dokumentenanfrage für einen Kunden, um seine Uploads hier zu verfolgen.',

    // Requests list
    'pro.requests.title': 'Anfragen',
    'pro.requests.subtitle': 'Verfolge den Fortschritt jedes Vorgangs.',
    'pro.requests.filterAria': 'Nach Status filtern',
    'pro.requests.filter.open': 'Laufend',
    'pro.requests.filter.completed': 'Abgeschlossen',
    'pro.requests.filter.archived': 'Archiviert',
    'pro.requests.filter.all': 'Alle',
    'pro.requests.emptyAll': 'Noch keine Anfragen. Erstelle eine Dokumentenanfrage für einen Kunden.',
    'pro.requests.emptyFiltered': 'Keine Anfragen mit diesem Status.',
    'pro.requests.progressLabel': '{validated}/{total} validiert',

    // Clients
    'pro.clients.title': 'Kunden',
    'pro.clients.subtitle': 'Deine Kunden und der Fortschritt ihrer Vorgänge.',
    'pro.clients.empty': 'Noch keine Kunden. Erstelle eine erste Anfrage, um einen Kunden hinzuzufügen.',
    'pro.clients.openCount': '{count} laufend',

    // New request page
    'pro.newRequestPage.subtitle':
      'Fordere Unterlagen von einem Kunden an — er erhält eine E-Mail und eine Benachrichtigung.',

    // New request form
    'pro.form.clientName': 'Name des Kunden',
    'pro.form.clientNamePlaceholder': 'Z. B. Lina Bernard',
    'pro.form.clientEmail': 'E-Mail-Adresse des Kunden',
    'pro.form.clientEmailPlaceholder': 'kunde@beispiel.de',
    'pro.form.title': 'Titel der Anfrage',
    'pro.form.titlePlaceholder': 'Immobiliendarlehen-Akte',
    'pro.form.itemsLegend': 'Benötigte Unterlagen',
    'pro.form.itemsHint': 'Der Kunde lädt für jede unten aufgeführte Unterlage ein Dokument hoch.',
    'pro.form.itemLabel': 'Unterlage {index}',
    'pro.form.removeItem': 'Diese Unterlage entfernen',
    'pro.form.itemNameLabel': 'Name der Unterlage',
    'pro.form.itemNamePlaceholder': 'Z. B. letzter Steuerbescheid',
    'pro.form.dueDateLabel': 'Frist',
    'pro.form.optional': '(optional)',
    'pro.form.addItem': '+ Unterlage hinzufügen',
    'pro.form.viewRequests': 'Meine Anfragen ansehen',
    'pro.form.submit': 'Anfrage erstellen',
    'pro.form.submitPending': 'Wird erstellt…',

    // Request detail
    'pro.detail.breadcrumbAria': 'Brotkrümelnavigation',
    'pro.detail.clientLabel': 'Kunde: {email}',
    'pro.detail.status.pending': 'Ausstehend',
    'pro.detail.status.submitted': 'Eingegangen',
    'pro.detail.status.validated': 'Validiert',
    'pro.detail.status.rejected': 'Abgelehnt',
    'pro.detail.dueDate': 'Frist: {date}',
    'pro.detail.comment': 'Kommentar: {comment}',
    'pro.detail.commentPlaceholder': 'Kommentar (optional)',
    'pro.detail.validate': 'Validieren',
    'pro.detail.reject': 'Ablehnen',
    'pro.detail.awaitingUpload': 'Wartet auf den Upload durch den Kunden.',
  },
}
