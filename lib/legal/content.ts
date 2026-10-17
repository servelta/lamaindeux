export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  links?: { label: string; href: string }[];
};
export type LegalDocument = {
  title: string;
  description: string;
  highlights: string[];
  sections: LegalSection[];
};

export const terms: LegalDocument = {
  title: "Conditions d’utilisation",
  description: "Le fonctionnement de LaMain2, les engagements des utilisateurs et les règles de réservation.",
  highlights: ["Recherche et réservation gratuites pour les clients", "Visibilité et outils financés par les artisans", "Intervention réglée directement à l’artisan"],
  sections: [
    { id: "plateforme", title: "1. Le rôle de LaMain2", paragraphs: [
      "LaMain2 est une plateforme de mise en relation entre des clients et des artisans en France, avec une présence à Paris. Elle permet de rechercher un professionnel, consulter son profil et ses services, choisir une disponibilité et transmettre une réservation ou une demande de devis.",
      "LaMain2 fournit le service de recherche et les outils de gestion des rendez-vous. L’artisan reste le prestataire de l’intervention : il établit ses offres, confirme ses engagements, réalise les travaux et répond de ses propres obligations professionnelles. Ces conditions s’appliquent à l’utilisation de la plateforme, sans remplacer le contrat conclu avec l’artisan.",
    ] },
    { id: "financement", title: "2. Gratuité pour les clients et financement", paragraphs: [
      "LaMain2 ne facture aux clients ni l’accès à la recherche, ni la consultation des profils, ni la réservation. Aucun paiement de l’intervention n’est encaissé par LaMain2. Le client règle directement l’artisan selon les modalités convenues avec lui.",
      "Les artisans rémunèrent LaMain2 pour la présentation de leur activité et l’accès aux outils de prise de rendez-vous et de gestion, selon leur contrat ou abonnement professionnel. LaMain2 ne prélève pas de commission sur le montant des interventions.",
      "Le prix, la durée, les éventuelles conditions de renouvellement et les modalités de résiliation de l’offre professionnelle sont communiqués à l’artisan avant sa souscription. La création d’un compte ne constitue pas, à elle seule, l’acceptation d’une offre payante non présentée.",
    ], links: [{ label: "Une question sur votre abonnement ?", href: "/contact/artisan" }] },
    { id: "recherche", title: "3. Référencement et classement des artisans", paragraphs: [
      "Les résultats dépendent du métier choisi, de la ville d’intervention, des services disponibles et du statut actif du professionnel. Les résultats sont principalement ordonnés selon la note des avis LaMain2. La note Google affichée est distincte de cette note interne.",
      "Une relation commerciale existe entre LaMain2 et les artisans référencés : la validation du compte, le contrat et le règlement de l’abonnement peuvent conditionner leur visibilité. Le fonctionnement actuel ne prévoit pas d’achat d’une meilleure position dans le classement par note. La présence dans les résultats n’assure ni un volume de rendez-vous ni une disponibilité immédiate.",
      "La mention de profil vérifié correspond à l’examen des informations du compte par l’équipe. Aucune pièce d’identité n’est demandée lors de l’inscription artisan. Cette mention ne remplace pas la vérification des qualifications, assurances ou autorisations nécessaires à une intervention particulière, et ne constitue pas une garantie de résultat des travaux.",
    ] },
    { id: "comptes", title: "4. Comptes et réservation sans compte", paragraphs: [
      "Le client peut choisir de réserver sans compte ou de se connecter. Les coordonnées demandées restent nécessaires pour organiser le rendez-vous, même sans inscription. Le lien de confirmation d’une réservation sans compte est personnel : ne le diffusez pas.",
      "Chaque utilisateur renseigne des informations exactes et tient ses coordonnées à jour. Les identifiants de connexion sont personnels. Utilisez un mot de passe unique et signalez tout accès suspect. Les comptes artisans sont destinés aux professionnels habilités à proposer les prestations annoncées.",
    ] },
    { id: "reservation", title: "5. Services, disponibilités et réservation", paragraphs: [
      "Avant de réserver, consultez le service sélectionné, le prix annoncé ou la mention « sur devis », les horaires, l’adresse et les conditions utiles à votre demande. Décrivez le besoin avec précision et transmettez uniquement les photos pertinentes.",
      "L’artisan gère ses services, ses prix et ses disponibilités. Les créneaux du matin, de l’après-midi ou du soir correspondent à des plages d’intervention ; ils ne promettent pas une heure d’arrivée précise. Une réservation enregistrée occupe le créneau selon les règles du calendrier. Le statut affiché et les échanges avec l’artisan permettent de suivre la demande.",
      "Conservez votre référence et vérifiez la page de confirmation. L’envoi d’un email dépend de sa bonne délivrance. Le bouton WhatsApp, lorsqu’il est disponible, ouvre un message préparé : son envoi demande une action de votre part. La plateforme n’est pas un service de secours ; en cas de danger immédiat, contactez les services d’urgence compétents.",
    ] },
    { id: "prix-devis", title: "6. Prix, devis, factures et paiement des travaux", paragraphs: [
      "Un service « sur devis » nécessite une proposition de l’artisan et votre accord avant les travaux. Pour une prestation à prix affiché, vérifiez ce qui est compris, les frais de déplacement, fournitures, taxes et éventuels suppléments. Tout changement de périmètre ou de prix doit être discuté et accepté avant les travaux supplémentaires.",
      "L’artisan est responsable du contenu de ses devis et factures, de ses mentions obligatoires et de ses obligations fiscales. L’outil PDF reprend les informations saisies et attribue des références de document ; il ne fournit pas un contrôle juridique ou comptable de chaque document. Les PDF téléchargés doivent être conservés par l’artisan.",
      "LaMain2 ne demande pas de coordonnées bancaires au client pour réserver. Une facture de l’artisan peut mentionner ses coordonnées bancaires si le paiement convenu est un virement. Vérifiez toujours le bénéficiaire auprès de l’artisan en cas de changement d’IBAN ou de message inhabituel.",
    ] },
    { id: "annulation", title: "7. Modification, annulation et droits du consommateur", paragraphs: [
      "En cas d’empêchement, prévenez l’artisan et utilisez les possibilités d’annulation présentes dans votre espace lorsqu’elles sont disponibles. Sans compte, contactez l’équipe avec votre référence. Une annulation doit être confirmée ; un simple message non transmis ne garantit pas la libération du créneau.",
      "Aucun frais d’annulation n’est prélevé au client par LaMain2. Les conséquences d’une annulation auprès de l’artisan dépendent de l’accord conclu et des règles applicables ; des frais ne peuvent être présumés à partir de la seule utilisation du site.",
      "Les droits légaux du consommateur, dont le droit de rétractation lorsqu’il s’applique, restent réservés. L’artisan fournit les informations nécessaires et recueille les demandes ou accords exprès exigés pour commencer avant l’expiration du délai. La sélection d’un service urgent ne vaut pas, à elle seule, renonciation générale à ces droits.",
    ], links: [{ label: "Information officielle sur la rétractation", href: "https://www.service-public.gouv.fr/particuliers/vosdroits/F10485" }] },
    { id: "contenus", title: "8. Avis, photos et utilisation loyale", paragraphs: [
      "Les avis LaMain2 peuvent être déposés par un client connecté après une réservation indiquée comme terminée, avec un avis par réservation. Ils doivent décrire une expérience réelle. Les notes et nombres d’avis Google renseignés sur les profils relèvent de Google et sont présentés séparément.",
      "L’utilisateur conserve ses droits sur ses contenus et autorise leur affichage pour fournir le service : profil, galerie, avis ou traitement de la réservation. Il doit disposer des droits nécessaires sur les images et éviter de publier des données de tiers sans justification.",
      "Les faux profils, faux avis, propos illicites, contenus discriminatoires, tentatives de fraude, collecte abusive de données et atteintes à la sécurité sont interdits. Un contenu peut être signalé à l’équipe. Une restriction ou suspension du compte peut être décidée pour protéger le service ; les droits de contestation et obligations d’information applicables restent préservés.",
    ], links: [{ label: "Signaler un problème ou un contenu", href: "/contact" }] },
    { id: "assistance", title: "9. Assistance et sécurité", paragraphs: [
      "Le chatbot est un assistant automatisé d’information sur la plateforme. Son portrait est illustratif. Ses réponses peuvent être incomplètes et ne remplacent ni le diagnostic d’un artisan ni une décision de l’équipe. Il ne peut pas vérifier la situation privée de votre compte ou garantir un rendez-vous.",
      "La demande de réponse personnelle transmet à l’équipe les coordonnées, la question et les extraits de conversation indiqués dans le formulaire. Ne transmettez jamais de mot de passe, code de connexion, numéro complet de carte bancaire ou information sensible inutile à votre demande.",
      "Les comptes et réservations sont soumis à des contrôles d’accès. Signalez un email suspect ou un incident via Contact. Aucune mesure technique ne permet de promettre une sécurité absolue ou une disponibilité continue.",
    ] },
    { id: "responsabilites", title: "10. Responsabilités", paragraphs: [
      "LaMain2 répond de ses propres obligations concernant la plateforme. L’artisan répond de ses offres, de ses qualifications, des assurances exigées pour son activité, de ses délais et de la qualité et conformité de ses prestations. Le client facilite l’accès au lieu convenu et signale les informations utiles à la sécurité de l’intervention.",
      "Des interruptions peuvent intervenir pour maintenance ou incident. Les liens vers des services externes, notamment Google Maps et WhatsApp, conduisent à des services soumis à leurs propres conditions. Aucune disposition de ces conditions ne retire les garanties légales ni les recours dont bénéficie le consommateur.",
    ] },
    { id: "donnees", title: "11. Données et propriété intellectuelle", paragraphs: [
      "Le traitement des données est décrit dans la politique de confidentialité et les cookies dans la politique dédiée. Le financement par les artisans n’autorise pas une diffusion publique des coordonnées des clients.",
      "Les éléments propres à LaMain2, dont ses textes, son interface et sa marque, sont protégés selon les droits applicables. Leur reproduction ou exploitation nécessite l’autorisation du titulaire, sous réserve des exceptions légales et des droits des tiers.",
    ], links: [{ label: "Politique de confidentialité", href: "/confidentialite" }, { label: "Politique de cookies", href: "/cookies" }] },
    { id: "reclamations", title: "12. Réclamations et évolution des conditions", paragraphs: [
      "Pour une difficulté avec la plateforme, contactez LaMain2 en indiquant la référence du rendez-vous s’il y en a une. Pour un litige relatif aux travaux, adressez d’abord votre réclamation à l’artisan ; il doit communiquer les coordonnées du médiateur de la consommation dont il relève lorsque cette obligation lui est applicable. L’équipe LaMain2 peut faciliter la transmission des informations sans se substituer aux parties ni au médiateur.",
      "Le droit français s’applique sous réserve des protections impératives du consommateur et des règles de compétence qui lui sont applicables. Le recours aux juridictions compétentes reste possible.",
      "La version datée en tête de page décrit les règles actuelles. Les modifications sont publiées ici ; les changements significatifs concernant un contrat existant font l’objet de l’information requise. Une mise à jour ne modifie pas rétroactivement les engagements déjà conclus avec un artisan.",
    ], links: [{ label: "Contacter LaMain2", href: "/contact" }] },
  ],
};

export const privacy: LegalDocument = {
  title: "Politique de confidentialité",
  description: "Quelles données sont utilisées, à quelles fins et comment exercer vos droits.",
  highlights: ["Vos coordonnées servent à organiser votre demande", "L’email de l’artisan reste privé", "Vos droits sont accessibles avec ou sans compte"],
  sections: [
    { id: "responsable", title: "1. Périmètre et contact", paragraphs: [
      "Cette politique concerne le site LaMain2, ses comptes clients et artisans, les réservations sans compte, les formulaires de contact et l’assistant de la plateforme. LaMain2 exerce son activité depuis Paris, France. Le point de contact pour les questions relatives aux données personnelles est le formulaire « Données personnelles / RGPD ».",
      "L’artisan qui reçoit une demande utilise les données nécessaires à son intervention et à ses propres obligations professionnelles. Ses traitements indépendants, notamment sa comptabilité et sa relation client, relèvent de sa responsabilité et peuvent faire l’objet de sa propre information de confidentialité.",
    ], links: [{ label: "Contacter LaMain2 pour vos données", href: "/contact/confidentialite" }] },
    { id: "collecte", title: "2. Les données concernées", paragraphs: [
      "Nous traitons les informations saisies dans les formulaires et générées lors de l’utilisation des fonctionnalités. Les champs marqués obligatoires servent à fournir le service demandé ; sans eux, certaines demandes ne peuvent pas être traitées. Les champs facultatifs peuvent rester vides.",
    ], items: [
      "Comptes : nom, prénom, email, téléphone, photo de profil éventuelle, rôle, dates de création et de connexion et informations d’authentification. Les mots de passe sont gérés sous forme hachée par le système d’authentification ; l’équipe ne peut pas afficher votre mot de passe.",
      "Artisans : entreprise, SIRET ou SIREN renseigné, métier, présentation, adresse professionnelle, zones d’intervention, téléphone, email de contact privé, photos, services, tarifs et disponibilités, ainsi que les informations de suivi du contrat et de l’abonnement.",
      "Réservations : identité et coordonnées du contact, adresse d’intervention, besoin décrit, photos éventuelles, artisan et service choisis, date, plage horaire, référence, prix ou demande de devis et historique des statuts.",
      "Avis et assistance : note et commentaire, contenu des formulaires et, si vous demandez une réponse personnelle depuis le chatbot, les extraits de conversation transmis et les coordonnées saisies.",
      "Statistiques des artisans : événements de clic sur « Appeler » associés au professionnel, avec date et emplacement du bouton, et décompte des réservations déjà enregistrées. Aucun nom, téléphone, adresse IP brute ou identifiant de visiteur n’est collecté par ce compteur. Il n’atteste ni un appel répondu ni une mise en relation téléphonique effective. Les données de réservation suivent les règles décrites séparément.",
      "Fonctionnement technique : adresse IP et informations de requête utiles à la sécurité, compteurs de limitation des tentatives, journaux techniques et cookies nécessaires. Nous ne demandons pas de pièce d’identité pour ouvrir un compte artisan.",
    ] },
    { id: "finalites", title: "3. Finalités et bases juridiques", paragraphs: [
      "Chaque utilisation des données répond à une finalité déterminée. L’acceptation des conditions d’utilisation n’équivaut pas à un consentement général à toute exploitation de vos données.",
    ], items: [
      "Créer et gérer un compte, publier le profil professionnel, transmettre une réservation et suivre un rendez-vous : exécution du service demandé ou mesures précontractuelles, y compris lorsque le client réserve sans compte.",
      "Gérer la relation professionnelle avec l’artisan, le contrat, l’abonnement et leurs justificatifs : exécution du contrat et obligations légales applicables.",
      "Répondre à une question et gérer une réclamation : préparation ou exécution du service selon le contexte ; intérêt légitime à assurer le suivi pour les demandes générales. Lorsqu’une démarche facultative repose sur votre consentement, vous pouvez le retirer pour l’avenir.",
      "Évaluer l’utilisation des boutons d’appel et des outils de réservation par artisan : intérêt légitime à mesurer le service fourni aux professionnels. Ces compteurs sont réservés aux administrateurs autorisés, sans profilage des visiteurs ni suivi entre sites.",
      "Sécuriser les accès, limiter les envois abusifs et traiter les incidents : intérêt légitime à protéger les utilisateurs et la plateforme, en tenant compte de leurs droits.",
      "Traiter l’exercice des droits, répondre à une demande légalement fondée d’une autorité et respecter une obligation de conservation : obligation légale. Conserver les éléments strictement utiles à la défense d’un droit : intérêt légitime correspondant.",
    ], links: [{ label: "Bases juridiques prévues par le RGPD", href: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2" }] },
    { id: "visibilite", title: "4. Informations publiques et destinataires", paragraphs: [
      "Le profil public de l’artisan présente les informations de son activité destinées aux clients, notamment ses services, son adresse professionnelle, son téléphone, ses horaires, ses photos et les avis. Son email de connexion et son email de contact privé ne sont pas publiés sur sa fiche.",
      "L’artisan concerné reçoit les coordonnées et les informations de la réservation nécessaires au rendez-vous. Les autres visiteurs n’ont pas accès au dossier de réservation. Les administrateurs autorisés peuvent consulter les informations de compte et de suivi pour exploiter la plateforme et répondre aux demandes ; ils n’ont pas accès aux mots de passe en clair.",
      "Les données ne sont pas proposées à la vente à des tiers pour leur prospection. Le paiement de la visibilité par les artisans finance le service et ne leur donne pas accès aux dossiers des autres professionnels.",
    ] },
    { id: "prestataires", title: "5. Prestataires et services externes", paragraphs: [
      "Le site utilise Vercel pour son hébergement et son exécution, Supabase pour la base de données, l’authentification et le stockage, et Resend pour l’envoi des emails lorsque ce service est configuré. Ces prestataires interviennent sur les données nécessaires à leur rôle.",
      "Un clic sur Google Maps, WhatsApp ou un lien de réseau social ouvre un service externe. Pour WhatsApp, les informations préremplies dans le lien peuvent être transmises au fournisseur dès son ouverture ; le message à l’artisan n’est envoyé qu’après votre validation dans WhatsApp. Vous pouvez utiliser les autres moyens de contact au lieu de cette option.",
      "Certains prestataires et leurs sous-traitants opèrent hors de l’Espace économique européen, notamment aux États-Unis. Leur documentation contractuelle décrit les lieux de traitement et les mécanismes prévus pour les transferts, tels que les clauses contractuelles types ou une décision d’adéquation applicable. Vous pouvez demander à LaMain2 les précisions et garanties relatives aux traitements qui vous concernent. Cette politique ne promet pas un hébergement exclusivement en France ou dans l’Union européenne.",
    ], links: [{ label: "Vercel : protection des données", href: "https://vercel.com/legal/privacy-policy" }, { label: "Supabase : accord de traitement des données", href: "https://supabase.com/legal/dpa" }, { label: "Resend : confidentialité", href: "https://resend.com/legal/privacy-policy" }] },
    { id: "chatbot-documents", title: "6. Chatbot, devis et factures", paragraphs: [
      "Le chatbot utilise les informations et règles de réponse de la plateforme. Sa conversation reste dans l’état de la page pendant son utilisation ; aucun historique permanent dans votre navigateur n’est prévu par cette fonctionnalité. Les questions sont envoyées au serveur pour préparer une réponse. Le code actuel ne les transmet pas à un fournisseur de modèle d’intelligence artificielle externe.",
      "Si vous choisissez une réponse personnelle, le formulaire indique les informations et extraits de conversation envoyés à l’équipe par email. Ne saisissez pas de données sensibles ni d’identifiants secrets dans le chat.",
      "Le formulaire de devis ou facture utilise les coordonnées saisies, celles du profil artisan et, le cas échéant, celles de la réservation choisie. Le contenu est validé côté serveur pour l’attribution du numéro. Les données de numérotation et une empreinte du contenu sont conservées ; le PDF complet et l’IBAN ne sont pas archivés dans ce registre de numérotation. Le PDF est généré pour téléchargement et l’artisan est responsable de sa conservation et de sa communication au client.",
    ] },
    { id: "conservation", title: "7. Conservation et suppression", paragraphs: [
      "La conservation dépend de l’usage des données, de la poursuite de la relation, de l’état d’une réservation, des obligations applicables et de la nécessité de traiter une réclamation ou défendre un droit. Les critères ci-dessous ne signifient pas que toutes les données sont effacées automatiquement à la fermeture d’un compte.",
    ], items: [
      "Informations de compte et profil : utilisées pendant la relation de service. Une demande de fermeture entraîne le traitement prévu pour le compte, sous réserve des informations encore nécessaires à l’historique des parties ou à une obligation légale.",
      "Réservations et échanges : conservés pour organiser et suivre la prestation, traiter les suites de la demande et préserver les justificatifs utiles. Les informations de contact présentes dans une réservation peuvent subsister après le retrait du profil afin de préserver les droits des parties ; elles ne sont pas rendues publiques pour cette raison.",
      "Demandes de support : conservées pendant leur traitement et, si nécessaire, pour en établir le suivi ou gérer une contestation. Les demandes de suppression ou de limitation sont examinées au regard de ces finalités.",
      "Informations de contrat, abonnement et numérotation : conservées dans la mesure nécessaire à la relation professionnelle, à la traçabilité des documents et aux obligations qui s’y appliquent. Les PDF conservés par l’artisan suivent ses propres obligations d’archivage.",
      "Cookies : durées décrites dans la politique de cookies. Les journaux et éléments de sécurité sont traités selon les besoins de protection, d’analyse d’incident et les durées techniques des prestataires. Demandez-nous les précisions concernant votre situation.",
    ], links: [{ label: "Demander un effacement ou une précision", href: "/contact/confidentialite" }, { label: "Consulter les durées des cookies", href: "/cookies" }] },
    { id: "securite", title: "8. Mesures de sécurité", paragraphs: [
      "Les mesures mises en œuvre comprennent les connexions HTTPS sur le site de production, l’authentification des comptes, les contrôles de rôle et de propriété des données, la validation des formulaires et la limitation de certaines tentatives ou demandes répétées. Les liens de confirmation sans compte utilisent un jeton signé et limité à une réservation.",
      "Les documents historiques déjà transmis avant le retrait de la fonction d’envoi restent soumis à des restrictions d’accès ; aucun nouvel envoi de pièce d’identité n’est demandé dans l’espace artisan. Les galeries publiques et les photos ajoutées volontairement à une réservation ne doivent pas contenir d’informations inutiles sur des tiers.",
      "Ces mesures réduisent les risques sans garantir une protection absolue. Protégez votre messagerie, ne partagez pas votre mot de passe ou votre lien de confirmation et signalez rapidement un incident. En cas de violation de données, les démarches d’information et de notification exigées par la réglementation doivent être effectuées selon la situation.",
    ] },
    { id: "droits", title: "9. Vos droits et leur exercice", paragraphs: [
      "Vous pouvez demander l’accès à vos données, leur rectification, leur effacement ou la limitation de leur utilisation. Selon la base juridique et les conditions applicables, vous pouvez aussi demander la portabilité, vous opposer à certains traitements ou retirer un consentement pour l’avenir. Ces droits peuvent connaître des limites, notamment lorsqu’une conservation reste légalement nécessaire.",
      "Les espaces personnels proposent des fonctions de modification, d’export des principales données du compte et de demande de suppression. Pour une demande plus complète, une réservation sans compte ou des données non comprises dans l’export, utilisez le formulaire dédié. Aucun compte ni numéro de téléphone n’est requis pour envoyer cette demande.",
      "Indiquez l’email concerné et, si utile, une référence de réservation pour permettre de retrouver le dossier. N’envoyez pas spontanément de pièce d’identité. En cas de doute raisonnable sur votre identité, seules les informations complémentaires nécessaires à sa vérification doivent être demandées.",
      "Le délai de réponse de principe est d’un mois à compter de la réception d’une demande permettant son traitement. Une prolongation justifiée, pouvant aller jusqu’à deux mois supplémentaires, doit vous être expliquée dans le délai initial. Vous pouvez déposer une réclamation auprès de la CNIL sans être tenu d’attendre l’issue d’une discussion amiable avec LaMain2.",
    ], links: [{ label: "Exercer mes droits", href: "/contact/confidentialite" }, { label: "Les droits prévus par le RGPD", href: "https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3" }, { label: "Adresser une plainte à la CNIL", href: "https://www.cnil.fr/fr/plaintes" }] },
    { id: "decisions", title: "10. Décisions automatisées et mises à jour", paragraphs: [
      "La recherche filtre les profils selon les critères choisis et les ordonne selon les informations de note de la plateforme. Le contrôle des créneaux vérifie leur disponibilité. Ces fonctions ne constituent pas une décision automatisée destinée à produire, à elle seule, des effets juridiques sur votre personne. Le chatbot ne décide pas d’une activation ou d’une sanction de compte.",
      "La version de cette politique est datée en tête de page. Une évolution importante des finalités, des destinataires ou des fonctionnalités nécessite une mise à jour de l’information et, lorsqu’il est requis, un nouveau consentement. Les demandes concernant cette politique peuvent être adressées via le formulaire dédié.",
    ] },
  ],
};

export const cookies: LegalDocument = {
  title: "Politique de cookies",
  description: "Les cookies nécessaires au fonctionnement de LaMain2 et les choix disponibles dans votre navigateur.",
  highlights: ["Pas de cookie publicitaire intégré au site", "Connexion et confirmation de réservation", "Navigation possible sans créer de compte"],
  sections: [
    { id: "definition", title: "1. À quoi servent les cookies ?", paragraphs: [
      "Un cookie est une petite information enregistrée par le navigateur pour reconnaître une session ou conserver un état technique. LaMain2 en utilise pour les fonctions demandées, notamment la connexion et l’accès à une confirmation de réservation sans compte. Un cookie ne permet pas à lui seul de lire les autres fichiers de votre appareil.",
      "Cette page couvre aussi les mécanismes similaires de stockage côté navigateur lorsqu’ils sont utilisés par le site. La configuration applicative actuelle n’intègre ni outil publicitaire, ni pixel de réseau social, ni outil de mesure d’audience utilisant des traceurs tel que Google Analytics. Le compteur interne des clics sur « Appeler » ne dépose aucun cookie et n’utilise ni stockage local ni identifiant de visiteur.",
    ] },
    { id: "inventaire", title: "2. Cookies utilisés par les fonctionnalités", paragraphs: [
      "Les noms peuvent varier selon le projet technique ou la référence de réservation. Un cookie long peut être réparti en plusieurs fragments portant un suffixe numérique.",
    ], items: [
      "Authentification — cookies commençant par « sb- » et liés au jeton de session Supabase, par exemple « sb-…-auth-token » : maintiennent la connexion et permettent le renouvellement de la session. La durée maximale configurée par la bibliothèque utilisée est de 400 jours, avec renouvellement possible ; la validité réelle de l’accès dépend aussi de celle de la session et de sa révocation. La déconnexion retire les cookies de la session concernée.",
      "Parcours d’authentification — cookie temporaire de vérification, lorsque le parcours de connexion ou de récupération le nécessite : permet de vérifier le retour d’un lien d’authentification. Il est retiré lorsque le parcours s’achève ; si le parcours est abandonné, le cookie peut subsister jusqu’à la durée maximale de 400 jours prévue par la bibliothèque, sans que le code d’authentification reste utilisable aussi longtemps.",
      "Confirmation sans compte — cookie « plan-b-receipt-… » : permet d’ouvrir la confirmation d’une réservation précise sans créer de compte. Sa durée maximale est de 30 jours. Il est limité à la page de confirmation concernée et utilise les protections HttpOnly, SameSite et Secure en production. Son expiration ne supprime pas la réservation elle-même.",
    ] },
    { id: "consentement", title: "3. Cookies nécessaires et consentement", paragraphs: [
      "Les cookies destinés exclusivement aux fonctions nécessaires demandées par l’utilisateur peuvent être utilisés sans consentement préalable dans les conditions prévues par la réglementation. C’est le rôle des cookies de session et de confirmation décrits ici. L’absence de bandeau publicitaire ne signifie pas que le site ne traite aucune donnée personnelle.",
      "Si LaMain2 ajoute des traceurs facultatifs nécessitant un consentement, ils devront rester inactifs avant votre choix. Vous devrez pouvoir les refuser aussi simplement que les accepter et retirer ensuite votre consentement. La simple poursuite de la navigation ou l’acceptation des conditions d’utilisation ne remplacent pas ce choix.",
    ], links: [{ label: "Règles de la CNIL sur les cookies", href: "https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi" }] },
    { id: "services-externes", title: "4. Liens externes et chatbot", paragraphs: [
      "Les liens vers Google Maps, WhatsApp et les réseaux sociaux ouvrent un autre service. LaMain2 n’intègre pas leurs boutons de suivi ou lecteurs embarqués pour afficher ces simples liens. Une fois le service externe ouvert, ses propres règles de cookies et de confidentialité s’appliquent.",
      "La conversation du chatbot est maintenue dans l’état de la page pendant son utilisation ; cette fonctionnalité ne prévoit pas d’enregistrement permanent dans le stockage local du navigateur. La demande de réponse personnelle est un envoi distinct, expliqué dans le formulaire et la politique de confidentialité.",
    ] },
    { id: "gerer", title: "5. Consulter, supprimer ou bloquer les cookies", paragraphs: [
      "Les réglages de confidentialité de votre navigateur permettent de consulter les données du site, de les supprimer ou de bloquer les cookies. Vous pouvez également vous déconnecter pour fermer votre session. Utilisez un appareil de confiance et évitez de partager les liens de confirmation.",
      "Le blocage des cookies nécessaires peut empêcher la connexion ou la réouverture d’une confirmation sans compte. Il n’annule pas un rendez-vous déjà transmis. Vous pouvez continuer à consulter les pages publiques et contacter l’équipe avec votre référence si vous n’avez plus accès à la confirmation.",
      "Une suppression dans le navigateur n’efface pas les données détenues dans les systèmes de LaMain2 ou de l’artisan. Pour demander leur accès ou leur effacement, utilisez le formulaire relatif aux données personnelles.",
    ], links: [{ label: "Exercer mes droits sur mes données", href: "/contact/confidentialite" }] },
    { id: "mise-a-jour", title: "6. Contact et évolution de cette politique", paragraphs: [
      "Cette politique décrit la configuration de la version 2026 examinée à la date indiquée en tête de page. Les fournisseurs techniques ou les fonctionnalités peuvent évoluer ; les nouvelles utilisations de cookies doivent être décrites ici et soumises au choix requis avant leur activation.",
      "Pour une question sur un cookie ou sur la protection de vos données, contactez LaMain2 via le formulaire dédié. La politique de confidentialité précise les données concernées, leurs destinataires et vos droits.",
    ], links: [{ label: "Politique de confidentialité", href: "/confidentialite" }, { label: "Contacter LaMain2 pour mes données", href: "/contact/confidentialite" }] },
  ],
};
