const legacyQuestions = [
  {
    id: 'provider-scope-route-tree', section: 'warmup', type: 'Quick recall', topic: 'Dependency injection', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'Why can providing a stateful service at component level create surprising behavior in a nested route tree?',
    hint: 'Think in terms of injector boundaries and component lifetime, not just singleton vs non-singleton.',
    keyPoints: ['Each provider declaration creates a scoped instance.', 'Route reuse and nested outlets can extend or replace lifetimes.', 'Descendants resolve the nearest matching provider.'],
    answer: 'A component-level provider creates one service instance per component injector. Descendants inherit that instance, while sibling or recreated route components may receive different ones. The resulting state lifetime follows the host component, not the application, so route reuse and nested outlets can make state appear to reset or split unexpectedly.',
  },
  {
    id: 'onpush-real-boundary', section: 'warmup', type: 'Explain like an interview', topic: 'Change detection', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'When does OnPush fail to deliver the performance improvement a developer expects?',
    hint: 'OnPush changes when a view is checked; it does not make expensive template work cheap.',
    keyPoints: ['Frequent notifications still schedule checks.', 'Expensive getters and unstable references remain expensive.', 'Large subtrees can still be traversed when marked dirty.'],
    answer: 'OnPush reduces unnecessary checks only when state boundaries are stable and updates are explicit. Recreating inputs, calling expensive template methods, marking views for check frequently, or emitting constantly through AsyncPipe can erase the expected gain. Measure the real hot path before treating the strategy as a blanket fix.',
  },
  {
    id: 'destroy-ref-lifecycle', section: 'warmup', type: 'Quick recall', topic: 'Lifecycle', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 2,
    prompt: 'What does DestroyRef improve over a hand-written destroyed$ Subject?',
    hint: 'Focus on ownership and cleanup locality.',
    keyPoints: ['Cleanup can be registered beside setup.', 'It uses the current injection-context lifetime.', 'It avoids a manual Subject and completion ceremony.'],
    answer: 'DestroyRef exposes the lifetime of the current injection context. Cleanup can be registered where a resource is created, and Angular invokes it when that context is destroyed. It removes manual Subject bookkeeping, although the developer still needs to choose the correct lifetime and cleanup boundary.',
  },
  {
    id: 'signal-input-contract', section: 'modern', type: 'Version difference', topic: 'Signal inputs', versions: [17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'You replace @Input() with input.required(). What changes conceptually beyond syntax?',
    hint: 'Consider the component API, reading the value, derived state, and requiredness.',
    keyPoints: ['The input becomes a read-only signal.', 'Required inputs are checked by tooling.', 'computed() can derive state without lifecycle synchronization.'],
    answer: 'A signal input is a reactive value owned by Angular and read by calling it. Requiredness becomes part of the component contract, and derived values can use computed() instead of mirroring inputs in ngOnChanges. It does not mean every input should become writable local state.',
    code: `title = input.required<string>();\nlabel = computed(() => this.title().trim());`,
  },
  {
    id: 'linked-signal-selection', section: 'modern', type: 'Architecture', topic: 'linkedSignal', versions: [19, 20, 21, 22], difficulty: 4,
    prompt: 'When is linkedSignal a better fit than computed or a plain writable signal?',
    hint: 'The value is writable, but its valid default depends on another reactive source.',
    keyPoints: ['computed is read-only derived state.', 'A plain signal can become invalid when its source changes.', 'linkedSignal can preserve a valid previous choice.'],
    answer: 'Use linkedSignal for writable state whose valid value is tied to another reactive source—for example, a selected item that should survive a list refresh when still valid and reset when it is not. Use computed for pure derivation and a plain signal for independent writable state.',
  },
  {
    id: 'zoneless-notifications', section: 'modern', type: 'Debugging', topic: 'Zoneless Angular', versions: [18, 19, 20, 21, 22], difficulty: 4,
    prompt: 'A zoneless component updates a plain field inside a third-party callback, but the UI stays stale. Why?',
    hint: 'Angular needs an explicit notification that a view may have changed.',
    keyPoints: ['ZoneJS no longer schedules broad synchronization.', 'Signals, AsyncPipe, listeners, setInput, or markForCheck notify Angular.', 'OnPush compatibility is a useful migration signal, not the only requirement.'],
    answer: 'Without ZoneJS, an arbitrary asynchronous callback is not itself a change-detection notification. Move the value into a signal read by the template, use an Angular-managed listener or AsyncPipe, or call markForCheck at the integration boundary. The goal is explicit notification, not manually running global change detection.',
  },
  {
    id: 'incremental-hydration-boundary', section: 'modern', type: 'Senior scenario', topic: 'SSR & hydration', versions: [19, 20, 21, 22], difficulty: 5,
    prompt: 'How do @defer and incremental hydration solve different performance problems?',
    hint: 'Separate when code is loaded from when server-rendered DOM becomes interactive.',
    keyPoints: ['@defer controls dependency loading.', 'Hydration attaches client behavior to server-rendered content.', 'Incremental hydration can keep a rendered defer block dehydrated until a trigger.'],
    answer: '@defer primarily controls when a block and its dependencies load. Hydration reuses server-rendered DOM and attaches client behavior. Incremental hydration combines the ideas: a defer block can render its main content on the server yet stay dehydrated until a hydrate trigger fires, reducing initial client work without placeholder layout shift.',
  },
  {
    id: 'resource-read-boundary', section: 'modern', type: 'Code review', topic: 'Resource API', versions: [19, 20, 21, 22], difficulty: 4,
    prompt: 'Why is resource() a poor default for a save mutation, even when it can call the endpoint?',
    hint: 'Consider cancellation when reactive request parameters change.',
    keyPoints: ['Resource is intended for reactive reads.', 'In-flight loaders can be aborted on a new request.', 'Mutations need explicit idempotency and user-intent handling.'],
    answer: 'Resource models reactive reads and may cancel an in-progress loader when its request changes or the resource is destroyed. That behavior is useful for queries but risky for mutations whose side effects must complete exactly once. Keep writes in an explicit command flow and reconcile their result into read state.',
  },
  {
    id: 'control-flow-track', section: 'code', type: 'Code review', topic: 'Modern templates', versions: [17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'Review this @for block. What production issue can tracking by $index create?',
    hint: 'Imagine inserting or sorting items while child rows hold local state.',
    keyPoints: ['Index identity shifts when the collection changes.', 'DOM and component instances can be reused for the wrong entity.', 'Track by stable domain identity where possible.'],
    answer: 'When rows are inserted, removed, or reordered, index identity changes. Angular may reuse a row component or DOM subtree for a different entity, carrying focus or local state to the wrong item and doing extra work. Track with a stable unique key such as item.id.',
    code: `@for (user of users(); track $index) {\n  <user-row [user]="user" />\n}`,
  },
  {
    id: 'share-replay-cache', section: 'code', type: 'Code review', topic: 'RxJS caching', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 4,
    prompt: 'What production problem could shareReplay(1) create here, and when might it be harmless?',
    hint: 'Ask who owns the stream, how long it lives, and whether the source completes.',
    keyPoints: ['A long-lived source can remain subscribed.', 'Cached errors or values may outlive the intended scope.', 'A completing HTTP request has different risk than an infinite source.'],
    answer: 'With a long-lived source, a replayed shared stream can keep upstream work and cached state alive beyond the last consumer, depending on configuration and ownership. For a one-shot HTTP request in a short-lived service it may be acceptable. Make reset/refCount behavior and cache lifetime explicit instead of assuming all shareReplay uses leak.',
    code: `users$ = this.route.params.pipe(\n  switchMap(({ teamId }) => this.api.getUsers(teamId)),\n  shareReplay(1)\n);`,
  },
  {
    id: 'effect-derived-state', section: 'code', type: 'Refactoring', topic: 'Signals', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'Why is an effect that copies one signal into another often a design smell?',
    hint: 'A value that can be calculated may not need independent ownership.',
    keyPoints: ['It creates synchronization and timing work.', 'computed expresses pure derivation.', 'Effects are best for side effects at boundaries.'],
    answer: 'Copying derivable state introduces two sources that can drift and schedules work through an effect. Prefer computed for pure derivation. Keep effect for boundary side effects such as logging, imperative APIs, or persistence, and use linkedSignal when a writable value legitimately depends on another source.',
    code: `fullName = signal('');\nconstructor() {\n  effect(() => this.fullName.set(this.first() + ' ' + this.last()));\n}`,
  },
  {
    id: 'flattening-operator-decision', section: 'rxjs', type: 'Multiple choice', topic: 'RxJS flattening', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 4,
    prompt: 'A user can click “Save” repeatedly. Which flattening operator fits if duplicate submissions must be ignored until the current save completes?',
    hint: 'You want to keep the first active inner subscription and ignore new source values.',
    keyPoints: ['exhaustMap ignores new triggers while active.', 'switchMap cancels prior work.', 'concatMap queues and mergeMap overlaps.'],
    answer: 'exhaustMap matches that policy: while the save observable is active, later clicks are ignored. The operator is not “best” in isolation; it encodes a product rule. Use concatMap if every click must queue, switchMap for replaceable reads, and mergeMap for intentional concurrency.',
  },
  {
    id: 'take-until-context', section: 'rxjs', type: 'Debugging', topic: 'Angular/RxJS interop', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 3,
    prompt: 'Why can takeUntilDestroyed() fail when called from a utility function outside an injection context?',
    hint: 'The operator needs to know which lifetime it should bind to.',
    keyPoints: ['Implicit DestroyRef lookup requires an injection context.', 'A DestroyRef can be passed explicitly.', 'The correct owner may be component, directive, service, or environment.'],
    answer: 'Without an injection context, Angular cannot infer the DestroyRef whose lifetime should complete the stream. Call it where injection is valid or pass an explicit DestroyRef into the utility. The deeper design question is which object actually owns the subscription.',
  },
  {
    id: 'signal-observable-boundary', section: 'rxjs', type: 'Architecture', topic: 'Signals & RxJS', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 4,
    prompt: 'Where would you draw the boundary between signals and observables in a modern feature?',
    hint: 'Model synchronous UI state separately from async event pipelines.',
    keyPoints: ['Signals suit synchronous state read by templates.', 'RxJS suits cancellation, concurrency, and multi-event workflows.', 'Convert at clear boundaries instead of bouncing repeatedly.'],
    answer: 'Keep observables where time, cancellation, backpressure, or event composition are the problem. Use signals for synchronous state and derivations consumed by the view. Convert at an ownership boundary—often the facade or component edge—and avoid repeatedly translating the same value in both directions.',
  },
  {
    id: 'ngrx-store-or-not', section: 'rxjs', type: 'Architecture', topic: 'NgRx architecture', versions: [16, 17, 18, 19, 20, 21, 22], difficulty: 4,
    prompt: 'When is adding global NgRx Store to a feature the wrong choice?',
    hint: 'State scope and coordination cost matter more than team habit.',
    keyPoints: ['Local ephemeral state may not justify global ceremony.', 'Server cache and UI state have different needs.', 'Choose by ownership, transitions, tooling, and cross-feature coordination.'],
    answer: 'Global Store is a poor fit when state is local, short-lived, simple, and not shared across boundaries. The actions/reducers/selectors become coordination cost without buying traceability or consistency. Use component signals, a focused service, ComponentStore, or Signal Store when their lifetime and transition model better match the feature.',
  },
  {
    id: 'signals-migration-150-screens', section: 'scenario', type: 'Senior scenario', topic: 'Migration strategy', versions: [18, 19, 20, 21, 22], difficulty: 5,
    prompt: 'A 150-screen Angular app proposes migrating all RxJS state to signals. What do you migrate, what stays, and how do you sequence it?',
    hint: 'Separate template-facing synchronous state from asynchronous workflows and organizational risk.',
    keyPoints: ['Start with measurable pain and clear ownership boundaries.', 'Keep RxJS for event/concurrency semantics it expresses well.', 'Migrate vertical slices with compatibility layers and rollback criteria.', 'Budget tests, tooling, and team learning.'],
    answer: 'Reject a syntax-driven rewrite. Inventory state by ownership and behavior, then pilot a vertical slice where signals simplify template state or derived values. Keep RxJS for cancellation-heavy workflows and stable public contracts. Define interop boundaries, performance and defect baselines, training, codemods only for mechanical cases, and stop/go criteria before scaling.',
  },
  {
    id: 'hydration-rollout', section: 'scenario', type: 'Senior scenario', topic: 'Rendering architecture', versions: [18, 19, 20, 21, 22], difficulty: 5,
    prompt: 'You need to improve LCP on a content-heavy SSR application. How would you evaluate incremental hydration safely?',
    hint: 'The answer needs measurement, boundaries, event behavior, and rollout strategy.',
    keyPoints: ['Profile real routes and bundle/hydration cost first.', 'Choose boundaries with stable placeholders and interaction triggers.', 'Test event replay, accessibility, errors, and slow networks.', 'Roll out by route with production telemetry.'],
    answer: 'Start with route-level traces and identify whether JavaScript, hydration, images, or server time actually dominates LCP. Pilot one expensive, self-contained block, choose explicit hydrate triggers, and test pre-hydration interaction and event replay. Compare lab and field metrics, monitor errors, and expand only where the complexity pays for itself.',
  },
];

const legacyLookupEntries = [
  {
    id: 'signal-inputs', title: 'Signal inputs', aliases: ['input.required', '@Input', 'signal input'],
    useWhen: 'Declaring reactive component inputs that participate naturally in computed state.',
    typical: `value = input.required<string>();`,
    trap: 'A Signal input is read-only to the receiving component; do not mirror it into writable state without a real ownership reason.',
    related: ['computed', 'model', 'linkedSignal'],
  },
  {
    id: 'take-until-destroyed', title: 'takeUntilDestroyed()', aliases: ['unsubscribe', 'DestroyRef', 'subscription cleanup'],
    useWhen: 'Completing an RxJS subscription with the lifetime of an Angular injection context.',
    typical: `stream$.pipe(takeUntilDestroyed()).subscribe();`,
    trap: 'Outside an injection context, pass DestroyRef explicitly—and first decide which lifetime owns the stream.',
    related: ['DestroyRef', 'AsyncPipe', 'toSignal'],
  },
  {
    id: 'linked-signal', title: 'linkedSignal()', aliases: ['dependent writable state', 'selection state'],
    useWhen: 'Writable state needs to reset or reconcile when a reactive source changes.',
    typical: `selected = linkedSignal(() => options()[0]);`,
    trap: 'Use computed for pure read-only derivation; linkedSignal exists because the result remains writable.',
    related: ['signal', 'computed', 'resource'],
  },
  {
    id: 'resource', title: 'resource()', aliases: ['async signals', 'loader', 'Resource API'],
    useWhen: 'A reactive request drives an asynchronous read and the UI needs signal-based value, loading, and error state.',
    typical: `user = resource({ params: () => id(), loader: ({ params }) => api.get(params) });`,
    trap: 'It is designed for reads; cancellation semantics make it a risky default for mutations.',
    related: ['rxResource', 'httpResource', 'route resources'],
  },
  {
    id: 'zoneless', title: 'Zoneless change detection', aliases: ['ZoneJS', 'provideZonelessChangeDetection', 'markForCheck'],
    useWhen: 'Reducing broad async patching and moving the app toward explicit change notifications.',
    typical: `bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });`,
    trap: 'Removing ZoneJS is not enough; integrations that mutate plain fields must still notify Angular.',
    related: ['signals', 'AsyncPipe', 'OnPush'],
  },
  {
    id: 'defer', title: '@defer', aliases: ['deferrable views', 'lazy template', 'viewport'],
    useWhen: 'Deferring standalone dependencies until an interaction, viewport, idle, timer, or condition trigger.',
    typical: `@defer (on viewport) { <heavy-chart /> } @placeholder { <chart-skeleton /> }`,
    trap: 'A poor placeholder or an above-the-fold trigger can cause layout shift; nested blocks can create cascading loads.',
    related: ['incremental hydration', 'prefetch', 'SSR'],
  },
  {
    id: 'switch-map', title: 'switchMap', aliases: ['cancel previous', 'flattening operator', 'typeahead'],
    useWhen: 'A new source value makes the previous inner result irrelevant, commonly for reads and typeahead.',
    typical: `query$.pipe(switchMap((query) => api.search(query)))`,
    trap: 'Cancellation is dangerous for writes that must complete; choose operators by product semantics.',
    related: ['concatMap', 'mergeMap', 'exhaustMap'],
  },
  {
    id: 'signal-store', title: 'NgRx Signal Store', aliases: ['signalStore', 'withState', 'withMethods'],
    useWhen: 'A feature needs structured signal-based state composition without necessarily entering global Store.',
    typical: `signalStore(withState(initialState), withComputed(...), withMethods(...))`,
    trap: 'A store abstraction does not fix unclear ownership or unnecessary global state.',
    related: ['ComponentStore', 'NgRx Store', 'signals'],
  },
];

const legacySectionMeta = {
  warmup: { label: 'Warm-up', eyebrow: '01 · settle in', description: 'Three compact prompts to switch on your Angular vocabulary.' },
  modern: { label: 'Modern Angular', eyebrow: '02 · close the gap', description: 'Angular 18–22 concepts, tradeoffs, and migration context.' },
  code: { label: 'Code Challenge', eyebrow: '03 · read the code', description: 'Review, debug, predict, and refactor realistic snippets.' },
  rxjs: { label: 'RxJS / NgRx', eyebrow: '04 · reason in streams', description: 'Operator semantics, state boundaries, and failure modes.' },
  scenario: { label: 'Senior Scenario', eyebrow: '05 · make the call', description: 'One architectural question with no single perfect answer.' },
};

const topicKeys = {
  'provider-scope-route-tree': 'dependency-injection',
  'onpush-real-boundary': 'change-detection',
  'destroy-ref-lifecycle': 'lifecycle',
  'signal-input-contract': 'signal-inputs',
  'linked-signal-selection': 'linked-signal',
  'zoneless-notifications': 'zoneless',
  'incremental-hydration-boundary': 'ssr-hydration',
  'resource-read-boundary': 'resource-api',
  'control-flow-track': 'modern-templates',
  'share-replay-cache': 'rxjs-caching',
  'effect-derived-state': 'signals',
  'flattening-operator-decision': 'rxjs-flattening',
  'take-until-context': 'angular-rxjs-interop',
  'signal-observable-boundary': 'signals-rxjs',
  'ngrx-store-or-not': 'ngrx-architecture',
  'signals-migration-150-screens': 'migration-strategy',
  'hydration-rollout': 'rendering-architecture',
};

const typeTranslations = {
  'Quick recall': { ru: 'Быстрый вопрос', es: 'Recuerdo rápido' },
  'Explain like an interview': { ru: 'Ответ как на интервью', es: 'Explicación de entrevista' },
  'Version difference': { ru: 'Различия версий', es: 'Diferencia entre versiones' },
  Architecture: { ru: 'Архитектура', es: 'Arquitectura' },
  Debugging: { ru: 'Отладка', es: 'Depuración' },
  'Senior scenario': { ru: 'Senior-сценарий', es: 'Escenario senior' },
  'Code review': { ru: 'Ревью кода', es: 'Revisión de código' },
  Refactoring: { ru: 'Рефакторинг', es: 'Refactorización' },
  'Multiple choice': { ru: 'Выбор решения', es: 'Elección de solución' },
};

const topicTranslations = {
  'dependency-injection': { ru: 'Внедрение зависимостей', es: 'Inyección de dependencias' },
  'change-detection': { ru: 'Обнаружение изменений', es: 'Detección de cambios' },
  lifecycle: { ru: 'Жизненный цикл', es: 'Ciclo de vida' },
  'signal-inputs': { ru: 'Сигнальные входы', es: 'Entradas de señal' },
  'linked-signal': { ru: 'linkedSignal', es: 'linkedSignal' },
  zoneless: { ru: 'Angular без ZoneJS', es: 'Angular sin ZoneJS' },
  'ssr-hydration': { ru: 'SSR и гидратация', es: 'SSR e hidratación' },
  'resource-api': { ru: 'Resource API', es: 'API Resource' },
  'modern-templates': { ru: 'Современные шаблоны', es: 'Plantillas modernas' },
  'rxjs-caching': { ru: 'Кэширование в RxJS', es: 'Caché con RxJS' },
  signals: { ru: 'Signals', es: 'Signals' },
  'rxjs-flattening': { ru: 'Операторы преобразования RxJS', es: 'Operadores de aplanado de RxJS' },
  'angular-rxjs-interop': { ru: 'Интеграция Angular и RxJS', es: 'Interoperabilidad Angular/RxJS' },
  'signals-rxjs': { ru: 'Signals и RxJS', es: 'Signals y RxJS' },
  'ngrx-architecture': { ru: 'Архитектура NgRx', es: 'Arquitectura NgRx' },
  'migration-strategy': { ru: 'Стратегия миграции', es: 'Estrategia de migración' },
  'rendering-architecture': { ru: 'Архитектура рендеринга', es: 'Arquitectura de renderizado' },
};

const translatedQuestionText = {
  'provider-scope-route-tree': {
    ru: {
      prompt: 'Почему stateful-сервис на уровне компонента может вести себя неожиданно во вложенном дереве маршрутов?',
      hint: 'Рассуждайте о границах инжекторов и времени жизни компонентов, а не только о singleton.',
      keyPoints: ['Каждое объявление provider создаёт экземпляр в своей области.', 'Повторное использование маршрута и вложенные outlet меняют время жизни.', 'Потомки получают ближайший подходящий provider.'],
      answer: 'Provider компонента создаёт экземпляр сервиса для каждого компонентного инжектора. Потомки наследуют его, а соседние или пересозданные маршруты могут получить другой экземпляр. Состояние живёт столько же, сколько компонент-хозяин, поэтому при route reuse и вложенных outlet оно может неожиданно сбрасываться или разделяться.',
    },
    es: {
      prompt: '¿Por qué un servicio con estado proporcionado en un componente puede comportarse de forma inesperada en un árbol de rutas anidado?',
      hint: 'Piensa en los límites del inyector y en la vida del componente, no solo en singleton frente a no singleton.',
      keyPoints: ['Cada declaración de provider crea una instancia con su propio ámbito.', 'La reutilización de rutas y los outlets anidados alteran la vida de la instancia.', 'Los descendientes resuelven el provider coincidente más cercano.'],
      answer: 'Un provider de componente crea una instancia por inyector de componente. Los descendientes la heredan, mientras que rutas hermanas o recreadas pueden recibir otra. El estado vive con el componente anfitrión, no con toda la aplicación, por lo que route reuse y los outlets anidados pueden provocar reinicios o divisiones inesperadas.',
    },
  },
  'onpush-real-boundary': {
    ru: {
      prompt: 'Когда OnPush не даёт ожидаемого прироста производительности?',
      hint: 'OnPush меняет момент проверки view, но не делает дорогую работу шаблона дешёвой.',
      keyPoints: ['Частые уведомления всё равно запускают проверки.', 'Дорогие getter и нестабильные ссылки остаются дорогими.', 'Большие поддеревья всё равно обходятся после пометки dirty.'],
      answer: 'OnPush сокращает лишние проверки только при стабильных границах состояния и явных обновлениях. Пересоздание входных объектов, дорогие методы в шаблоне, частый markForCheck или постоянные emission через AsyncPipe могут свести выигрыш к нулю. Сначала измеряйте реальный hot path.',
    },
    es: {
      prompt: '¿Cuándo OnPush no aporta la mejora de rendimiento que se esperaba?',
      hint: 'OnPush cambia cuándo se comprueba una vista; no abarata el trabajo costoso de la plantilla.',
      keyPoints: ['Las notificaciones frecuentes siguen programando comprobaciones.', 'Los getters costosos y las referencias inestables siguen siendo costosos.', 'Los subárboles grandes aún se recorren cuando quedan dirty.'],
      answer: 'OnPush reduce comprobaciones innecesarias cuando los límites de estado son estables y las actualizaciones son explícitas. Recrear inputs, llamar métodos costosos en plantilla, usar markForCheck continuamente o emitir sin parar mediante AsyncPipe puede eliminar la ventaja. Mide el hot path real antes de tratarlo como solución universal.',
    },
  },
  'destroy-ref-lifecycle': {
    ru: {
      prompt: 'Что DestroyRef улучшает по сравнению с вручную созданным Subject destroyed$?',
      hint: 'Сосредоточьтесь на владельце ресурса и близости cleanup к setup.',
      keyPoints: ['Cleanup регистрируется рядом с созданием ресурса.', 'Используется время жизни текущего injection context.', 'Не нужны отдельный Subject и ручной complete.'],
      answer: 'DestroyRef предоставляет время жизни текущего injection context. Cleanup можно зарегистрировать там, где ресурс создаётся, и Angular вызовет его при уничтожении контекста. Ручной Subject больше не нужен, но правильную границу времени жизни всё равно выбирает разработчик.',
    },
    es: {
      prompt: '¿Qué mejora DestroyRef frente a un Subject destroyed$ escrito a mano?',
      hint: 'Céntrate en la propiedad del recurso y en mantener el cleanup junto al setup.',
      keyPoints: ['El cleanup se registra junto a la creación del recurso.', 'Usa la vida del injection context actual.', 'Evita un Subject y un complete manuales.'],
      answer: 'DestroyRef expone la vida del injection context actual. El cleanup puede registrarse donde se crea el recurso y Angular lo invoca al destruir ese contexto. Elimina la gestión manual del Subject, aunque aún hay que elegir correctamente el propietario y el límite de vida.',
    },
  },
  'signal-input-contract': {
    ru: {
      prompt: 'Вы заменяете @Input() на input.required(). Что меняется концептуально, кроме синтаксиса?',
      hint: 'Учтите контракт компонента, чтение значения, производное состояние и обязательность.',
      keyPoints: ['Вход становится read-only signal.', 'Обязательность проверяется инструментами сборки.', 'computed() создаёт производное состояние без синхронизации lifecycle-хуками.'],
      answer: 'Сигнальный input — реактивное значение под управлением Angular, которое читается вызовом функции. Обязательность становится частью контракта, а производные значения можно выразить через computed() вместо копирования в ngOnChanges. Это не превращает каждый input в локальное writable-состояние.',
    },
    es: {
      prompt: 'Sustituyes @Input() por input.required(). ¿Qué cambia conceptualmente además de la sintaxis?',
      hint: 'Considera el contrato del componente, la lectura, el estado derivado y la obligatoriedad.',
      keyPoints: ['La entrada pasa a ser una signal de solo lectura.', 'Las herramientas comprueban las entradas obligatorias.', 'computed() deriva estado sin sincronización mediante lifecycle hooks.'],
      answer: 'Una signal input es un valor reactivo gestionado por Angular que se lee invocándolo. La obligatoriedad forma parte del contrato y los valores derivados pueden usar computed() en vez de duplicarse en ngOnChanges. No implica convertir cada input en estado local escribible.',
    },
  },
  'linked-signal-selection': {
    ru: {
      prompt: 'Когда linkedSignal подходит лучше, чем computed или обычный writable signal?',
      hint: 'Значение можно менять, но его допустимое значение по умолчанию зависит от другого реактивного источника.',
      keyPoints: ['computed — read-only производное состояние.', 'Обычный signal может стать недопустимым после изменения источника.', 'linkedSignal способен сохранить прежний выбор, если он всё ещё допустим.'],
      answer: 'Используйте linkedSignal для изменяемого состояния, допустимость которого связана с другим реактивным источником: например, выбранный элемент остаётся после обновления списка, если ещё существует, иначе сбрасывается. computed нужен для чистого вычисления, обычный signal — для независимого состояния.',
    },
    es: {
      prompt: '¿Cuándo encaja mejor linkedSignal que computed o una signal escribible normal?',
      hint: 'El valor se puede escribir, pero su valor válido por defecto depende de otra fuente reactiva.',
      keyPoints: ['computed representa estado derivado de solo lectura.', 'Una signal normal puede quedar inválida cuando cambia su fuente.', 'linkedSignal puede conservar una selección anterior que siga siendo válida.'],
      answer: 'Usa linkedSignal para estado escribible cuyo valor válido depende de otra fuente reactiva: por ejemplo, una selección que se conserva tras refrescar una lista si aún existe y se reinicia si no. Usa computed para derivación pura y una signal normal para estado independiente.',
    },
  },
  'zoneless-notifications': {
    ru: {
      prompt: 'В zoneless-компоненте обычное поле меняется внутри callback сторонней библиотеки, но UI не обновляется. Почему?',
      hint: 'Angular нужно явное уведомление о возможном изменении view.',
      keyPoints: ['ZoneJS больше не запускает широкую синхронизацию.', 'Signals, AsyncPipe, listeners, setInput и markForCheck уведомляют Angular.', 'Совместимость с OnPush полезна для миграции, но не является единственным требованием.'],
      answer: 'Без ZoneJS произвольный асинхронный callback сам по себе не уведомляет change detection. Поместите значение в signal, читаемый шаблоном, используйте listener/AsyncPipe под управлением Angular или вызовите markForCheck на границе интеграции. Нужны явные уведомления, а не ручной глобальный detectChanges.',
    },
    es: {
      prompt: 'Un componente zoneless actualiza un campo normal dentro del callback de una librería, pero la interfaz queda desactualizada. ¿Por qué?',
      hint: 'Angular necesita una notificación explícita de que una vista puede haber cambiado.',
      keyPoints: ['ZoneJS ya no programa una sincronización amplia.', 'Signals, AsyncPipe, listeners, setInput o markForCheck notifican a Angular.', 'La compatibilidad con OnPush ayuda en la migración, pero no es el único requisito.'],
      answer: 'Sin ZoneJS, un callback asíncrono arbitrario no constituye una notificación de change detection. Mueve el valor a una signal leída por la plantilla, usa un listener o AsyncPipe gestionado por Angular, o llama a markForCheck en el límite de integración. El objetivo son notificaciones explícitas, no ejecutar detectChanges globalmente.',
    },
  },
  'incremental-hydration-boundary': {
    ru: {
      prompt: 'Как @defer и incremental hydration решают разные задачи производительности?',
      hint: 'Отделите момент загрузки кода от момента, когда серверный DOM становится интерактивным.',
      keyPoints: ['@defer управляет загрузкой зависимостей.', 'Hydration подключает клиентское поведение к серверному контенту.', 'Incremental hydration оставляет отрисованный defer-блок дегидратированным до trigger.'],
      answer: '@defer прежде всего определяет, когда загружать блок и его зависимости. Hydration повторно использует серверный DOM и подключает поведение. Incremental hydration сочетает их: основной контент блока может прийти с сервера, но оставаться неактивным до hydrate-trigger, уменьшая стартовую работу клиента без скачка placeholder.',
    },
    es: {
      prompt: '¿Cómo resuelven @defer y la hidratación incremental problemas de rendimiento distintos?',
      hint: 'Separa cuándo se carga el código de cuándo el DOM renderizado en servidor se vuelve interactivo.',
      keyPoints: ['@defer controla la carga de dependencias.', 'La hidratación conecta comportamiento cliente al contenido del servidor.', 'La hidratación incremental puede mantener deshidratado un bloque ya renderizado hasta un trigger.'],
      answer: '@defer controla principalmente cuándo se cargan un bloque y sus dependencias. La hidratación reutiliza el DOM del servidor y conecta el comportamiento cliente. La hidratación incremental combina ambas ideas: el contenido principal puede renderizarse en servidor y permanecer deshidratado hasta un trigger, reduciendo el trabajo inicial sin salto de placeholder.',
    },
  },
  'resource-read-boundary': {
    ru: {
      prompt: 'Почему resource() — плохой выбор по умолчанию для сохранения данных, даже если loader может вызвать endpoint?',
      hint: 'Учтите отмену запроса при изменении реактивных параметров.',
      keyPoints: ['Resource предназначен для реактивного чтения.', 'Новый request может отменить текущий loader.', 'Для мутаций важны явные правила идемпотентности и намерение пользователя.'],
      answer: 'Resource моделирует реактивное чтение и может отменить выполняющийся loader при изменении params или уничтожении ресурса. Для query это полезно, но для мутации, которая должна завершиться ровно один раз, опасно. Запись оформляйте отдельной командой, а её результат согласуйте с read-состоянием.',
    },
    es: {
      prompt: '¿Por qué resource() no es una buena opción por defecto para una mutación de guardado, aunque pueda llamar al endpoint?',
      hint: 'Considera la cancelación cuando cambian los parámetros reactivos.',
      keyPoints: ['Resource está pensado para lecturas reactivas.', 'Un request nuevo puede abortar un loader en curso.', 'Las mutaciones necesitan reglas explícitas de idempotencia e intención del usuario.'],
      answer: 'Resource modela lecturas reactivas y puede cancelar un loader en curso al cambiar params o destruirse. Es útil para consultas, pero arriesgado para una mutación cuyo efecto debe completarse una sola vez. Mantén las escrituras en un flujo de comando explícito y reconcilia el resultado con el estado de lectura.',
    },
  },
  'control-flow-track': {
    ru: {
      prompt: 'Проведите ревью этого @for. Какую проблему в production может создать track $index?',
      hint: 'Представьте вставку или сортировку элементов, когда у дочерних строк есть локальное состояние.',
      keyPoints: ['Индексная идентичность сдвигается при изменении коллекции.', 'DOM и экземпляры компонентов могут переиспользоваться для другой сущности.', 'По возможности используйте стабильный доменный идентификатор.'],
      answer: 'При вставке, удалении или сортировке индекс меняется. Angular может переиспользовать строку компонента или DOM для другой сущности, перенеся фокус и локальное состояние не туда и выполнив лишнюю работу. Используйте стабильный уникальный ключ, например user.id.',
    },
    es: {
      prompt: 'Revisa este bloque @for. ¿Qué problema de producción puede crear track $index?',
      hint: 'Imagina insertar u ordenar elementos mientras las filas hijas conservan estado local.',
      keyPoints: ['La identidad por índice cambia con la colección.', 'DOM e instancias de componente pueden reutilizarse para otra entidad.', 'Siempre que sea posible, usa una identidad estable del dominio.'],
      answer: 'Al insertar, eliminar u ordenar, cambia la identidad por índice. Angular puede reutilizar una fila o un subárbol DOM para otra entidad, trasladando foco o estado local al elemento incorrecto y haciendo trabajo extra. Usa una clave única estable como user.id.',
    },
  },
  'share-replay-cache': {
    ru: {
      prompt: 'Какую production-проблему может создать здесь shareReplay(1) и когда он может быть безопасен?',
      hint: 'Спросите, кто владеет stream, сколько он живёт и завершается ли source.',
      keyPoints: ['Долгоживущий source может остаться подписанным.', 'Закэшированные ошибки или значения способны пережить нужную область.', 'Завершающийся HTTP-запрос отличается от бесконечного source.'],
      answer: 'Для долгоживущего source replay-поток может удерживать upstream-работу и кэш после ухода последнего consumer — в зависимости от конфигурации и владельца. Для одноразового HTTP-запроса в короткоживущем сервисе риск меньше. Явно задавайте refCount/reset и срок жизни кэша.',
    },
    es: {
      prompt: '¿Qué problema de producción puede crear aquí shareReplay(1) y cuándo podría ser inocuo?',
      hint: 'Pregunta quién posee el stream, cuánto vive y si la fuente termina.',
      keyPoints: ['Una fuente de larga vida puede seguir suscrita.', 'Errores o valores en caché pueden sobrevivir a su ámbito previsto.', 'Una petición HTTP que completa tiene un riesgo distinto de una fuente infinita.'],
      answer: 'Con una fuente de larga vida, un stream compartido con replay puede mantener trabajo upstream y estado en caché después del último consumidor, según la configuración y propiedad. En una petición HTTP única dentro de un servicio corto puede ser aceptable. Haz explícitos refCount/reset y la vida de la caché.',
    },
  },
  'effect-derived-state': {
    ru: {
      prompt: 'Почему effect, который копирует один signal в другой, часто указывает на проблему дизайна?',
      hint: 'Значению, которое можно вычислить, может не понадобиться независимый владелец.',
      keyPoints: ['Появляются синхронизация и зависимость от времени выполнения.', 'computed явно выражает чистое вычисление.', 'Effects лучше подходят для побочных эффектов на границах.'],
      answer: 'Копирование вычисляемого значения создаёт два источника, способных разойтись, и планирует работу через effect. Для чистого вычисления используйте computed. effect оставляйте для логирования, императивных API и persistence, а linkedSignal — для обоснованно изменяемого зависимого значения.',
    },
    es: {
      prompt: '¿Por qué un effect que copia una signal en otra suele indicar un problema de diseño?',
      hint: 'Un valor calculable quizá no necesite propiedad independiente.',
      keyPoints: ['Introduce sincronización y trabajo temporal.', 'computed expresa una derivación pura.', 'Los effects encajan mejor en efectos secundarios de límites.'],
      answer: 'Copiar estado derivable introduce dos fuentes que pueden divergir y programa trabajo mediante un effect. Prefiere computed para derivación pura. Reserva effect para límites como logging, APIs imperativas o persistencia, y linkedSignal cuando un valor escribible dependa legítimamente de otra fuente.',
    },
  },
  'flattening-operator-decision': {
    ru: {
      prompt: 'Пользователь может нажать «Сохранить» несколько раз. Какой flattening operator подойдёт, если повторные отправки нужно игнорировать до завершения текущей?',
      hint: 'Нужно сохранить первую активную inner subscription и игнорировать новые значения source.',
      keyPoints: ['exhaustMap игнорирует новые trigger, пока активен текущий.', 'switchMap отменяет предыдущую работу.', 'concatMap ставит в очередь, mergeMap запускает параллельно.'],
      answer: 'Этой политике соответствует exhaustMap: пока save-observable активен, следующие клики игнорируются. Оператор кодирует продуктовое правило. concatMap нужен, если каждый клик должен попасть в очередь, switchMap — для заменяемых чтений, mergeMap — для намеренной конкуренции.',
    },
    es: {
      prompt: 'El usuario puede pulsar «Guardar» varias veces. ¿Qué operador de aplanado encaja si hay que ignorar duplicados hasta que termine el guardado actual?',
      hint: 'Quieres conservar la primera suscripción interna activa e ignorar nuevos valores de origen.',
      keyPoints: ['exhaustMap ignora nuevos triggers mientras hay uno activo.', 'switchMap cancela el trabajo anterior.', 'concatMap encola y mergeMap solapa.'],
      answer: 'exhaustMap representa esa política: mientras el observable de guardado está activo, ignora los clics posteriores. El operador codifica una regla de producto. Usa concatMap si cada clic debe encolarse, switchMap para lecturas reemplazables y mergeMap para concurrencia intencionada.',
    },
  },
  'take-until-context': {
    ru: {
      prompt: 'Почему takeUntilDestroyed() может не сработать в utility-функции вне injection context?',
      hint: 'Оператору нужно понять, к какому времени жизни привязаться.',
      keyPoints: ['Неявный поиск DestroyRef требует injection context.', 'DestroyRef можно передать явно.', 'Владельцем может быть компонент, директива, сервис или environment.'],
      answer: 'Вне injection context Angular не может определить DestroyRef, который должен завершить stream. Вызывайте оператор там, где injection доступен, или передайте DestroyRef в utility явно. Главный вопрос — какой объект действительно владеет подпиской.',
    },
    es: {
      prompt: '¿Por qué puede fallar takeUntilDestroyed() al llamarlo desde una utilidad fuera de un injection context?',
      hint: 'El operador necesita saber a qué ciclo de vida debe vincularse.',
      keyPoints: ['La resolución implícita de DestroyRef requiere injection context.', 'Se puede pasar un DestroyRef explícito.', 'El propietario correcto puede ser componente, directiva, servicio o environment.'],
      answer: 'Sin injection context, Angular no puede inferir el DestroyRef cuya vida debe completar el stream. Llámalo donde la inyección sea válida o pasa un DestroyRef explícito a la utilidad. La decisión profunda es qué objeto posee realmente la suscripción.',
    },
  },
  'signal-observable-boundary': {
    ru: {
      prompt: 'Где вы проведёте границу между signals и observables в современной feature?',
      hint: 'Отделите синхронное UI-состояние от асинхронных event pipeline.',
      keyPoints: ['Signals подходят для синхронного состояния шаблона.', 'RxJS подходит для отмены, конкуренции и многошаговых event workflow.', 'Преобразуйте на ясной границе, а не постоянно в обе стороны.'],
      answer: 'Оставляйте observables там, где важны время, отмена, backpressure или композиция событий. Signals используйте для синхронного состояния и производных значений view. Преобразуйте на границе владельца — часто в facade или компоненте — и не гоняйте одно значение многократно туда и обратно.',
    },
    es: {
      prompt: '¿Dónde trazarías el límite entre signals y observables en una feature moderna?',
      hint: 'Separa el estado síncrono de UI de los pipelines de eventos asíncronos.',
      keyPoints: ['Las signals encajan con estado síncrono leído por plantillas.', 'RxJS encaja con cancelación, concurrencia y flujos multievento.', 'Convierte en límites claros, no continuamente en ambos sentidos.'],
      answer: 'Mantén observables donde el problema sea tiempo, cancelación, backpressure o composición de eventos. Usa signals para estado síncrono y derivaciones de la vista. Convierte en un límite de propiedad —a menudo facade o componente— y evita traducir el mismo valor repetidamente en ambos sentidos.',
    },
  },
  'ngrx-store-or-not': {
    ru: {
      prompt: 'Когда добавление глобального NgRx Store в feature будет неправильным выбором?',
      hint: 'Область состояния и стоимость координации важнее привычки команды.',
      keyPoints: ['Локальное временное состояние не всегда оправдывает глобальную церемонию.', 'Server cache и UI-state требуют разного.', 'Выбирайте по владельцу, переходам, инструментам и связям между feature.'],
      answer: 'Global Store плохо подходит для локального, короткоживущего, простого состояния без совместного использования между границами. Actions/reducers/selectors добавляют координацию без выигрыша в трассируемости. Выберите component signals, сервис, ComponentStore или Signal Store, если их время жизни и модель переходов точнее.',
    },
    es: {
      prompt: '¿Cuándo es incorrecto añadir NgRx Store global a una feature?',
      hint: 'El ámbito del estado y el coste de coordinación importan más que la costumbre del equipo.',
      keyPoints: ['El estado local efímero puede no justificar ceremonia global.', 'La caché de servidor y el estado de UI tienen necesidades distintas.', 'Decide por propiedad, transiciones, herramientas y coordinación entre features.'],
      answer: 'Store global encaja mal cuando el estado es local, breve, simple y no se comparte entre límites. Actions, reducers y selectors añaden coordinación sin aportar trazabilidad suficiente. Usa component signals, un servicio enfocado, ComponentStore o Signal Store si su vida y modelo de transición encajan mejor.',
    },
  },
  'signals-migration-150-screens': {
    ru: {
      prompt: 'В Angular-приложении на 150 экранов предлагают перенести всё RxJS-состояние на signals. Что мигрировать, что оставить и в каком порядке?',
      hint: 'Отделите синхронное состояние шаблона от async workflow и организационного риска.',
      keyPoints: ['Начните с измеримой проблемы и ясных границ владения.', 'Оставьте RxJS там, где он хорошо выражает события и конкуренцию.', 'Мигрируйте вертикальными срезами с совместимостью и rollback-критериями.', 'Учтите тесты, инструменты и обучение команды.'],
      answer: 'Откажитесь от переписывания ради синтаксиса. Классифицируйте состояние по владельцу и поведению, затем выберите вертикальный срез, где signals упрощают template-state или вычисления. Оставьте RxJS для cancellation-heavy workflow и стабильных контрактов. До масштабирования определите interop-границы, метрики, обучение и stop/go-критерии.',
    },
    es: {
      prompt: 'Una aplicación Angular de 150 pantallas propone migrar todo el estado RxJS a signals. ¿Qué migras, qué mantienes y cómo lo secuencias?',
      hint: 'Separa el estado síncrono de plantilla de los flujos asíncronos y del riesgo organizativo.',
      keyPoints: ['Empieza por dolor medible y límites claros de propiedad.', 'Mantén RxJS donde exprese bien eventos y concurrencia.', 'Migra cortes verticales con compatibilidad y criterios de rollback.', 'Presupuesta pruebas, herramientas y aprendizaje del equipo.'],
      answer: 'Rechaza una reescritura guiada por sintaxis. Clasifica el estado por propiedad y comportamiento, y pilota un corte vertical donde signals simplifique la vista o las derivaciones. Conserva RxJS para flujos con cancelación y contratos estables. Define límites de interop, métricas, formación y criterios de stop/go antes de ampliar.',
    },
  },
  'hydration-rollout': {
    ru: {
      prompt: 'Нужно улучшить LCP контентного SSR-приложения. Как безопасно оценить incremental hydration?',
      hint: 'Нужны измерения, границы, поведение событий и стратегия rollout.',
      keyPoints: ['Сначала профилируйте реальные маршруты и стоимость bundle/hydration.', 'Выбирайте границы со стабильными placeholder и interaction trigger.', 'Проверяйте event replay, accessibility, ошибки и медленную сеть.', 'Разворачивайте по маршрутам с production-телеметрией.'],
      answer: 'Начните с трассировок маршрутов и выясните, что реально доминирует в LCP: JavaScript, hydration, изображения или сервер. Проведите пилот на одном дорогом изолированном блоке, задайте hydrate-trigger и проверьте взаимодействия до hydration и event replay. Сравните lab/field metrics и расширяйте только при доказанном выигрыше.',
    },
    es: {
      prompt: 'Debes mejorar el LCP de una aplicación SSR con mucho contenido. ¿Cómo evaluarías la hidratación incremental con seguridad?',
      hint: 'La respuesta necesita medición, límites, comportamiento de eventos y estrategia de despliegue.',
      keyPoints: ['Primero perfila rutas reales y el coste de bundle/hidratación.', 'Elige límites con placeholders estables y triggers de interacción.', 'Prueba event replay, accesibilidad, errores y redes lentas.', 'Despliega por ruta con telemetría de producción.'],
      answer: 'Empieza con trazas por ruta e identifica si dominan JavaScript, hidratación, imágenes o servidor. Pilota un bloque costoso y aislado, elige triggers explícitos y prueba interacción previa y event replay. Compara métricas de laboratorio y campo, vigila errores y amplía solo cuando la complejidad compense.',
    },
  },
};

const exampleCatalog = {
  'signal-input-contract': {
    context: {
      en: 'A product card declares a required input, derives a presentation label, and keeps the template contract explicit.',
      ru: 'Карточка товара объявляет обязательный input, вычисляет подпись и оставляет контракт шаблона явным.',
      es: 'Una tarjeta de producto declara una entrada obligatoria, deriva una etiqueta y mantiene explícito el contrato de plantilla.',
    },
    files: {
      ts: "import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';\n\n@Component({\n  selector: 'app-product-card',\n  templateUrl: './product-card.html',\n  styleUrl: './product-card.scss',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})\nexport class ProductCard {\n  readonly title = input.required<string>();\n  readonly price = input.required<number>();\n  readonly label = computed(() => this.title().trim());\n}",
      html: "<article class=\"product-card\">\n  <h3>{{ label() }}</h3>\n  <strong>{{ price() | currency }}</strong>\n</article>",
      scss: ".product-card {\n  display: grid;\n  gap: 0.5rem;\n  padding: 1rem;\n  border: 1px solid currentColor;\n  border-radius: 1rem;\n}",
    },
  },
  'linked-signal-selection': {
    context: {
      en: 'A selection remains writable but reconciles itself when the available options change.',
      ru: 'Выбор остаётся изменяемым, но автоматически согласуется с обновлённым набором вариантов.',
      es: 'La selección sigue siendo escribible, pero se reconcilia al cambiar las opciones disponibles.',
    },
    files: {
      ts: "readonly options = input.required<ShippingOption[]>();\nreadonly selected = linkedSignal<ShippingOption[], ShippingOption | undefined>({\n  source: this.options,\n  computation: (options, previous) =>\n    options.find(({ id }) => id === previous?.value?.id) ?? options[0],\n});",
      html: "@for (option of options(); track option.id) {\n  <button type=\"button\" (click)=\"selected.set(option)\">\n    {{ option.label }}\n  </button>\n}",
    },
  },
  'zoneless-notifications': {
    context: {
      en: 'A third-party callback writes to a template-read signal, which gives Angular an explicit change notification.',
      ru: 'Callback сторонней библиотеки записывает значение в signal шаблона и тем самым явно уведомляет Angular.',
      es: 'El callback de una librería escribe en una signal leída por la plantilla y notifica explícitamente a Angular.',
    },
    files: {
      ts: "readonly position = signal({ x: 0, y: 0 });\n\nngAfterViewInit() {\n  this.map.on('move', ({ x, y }) => {\n    this.position.set({ x, y });\n  });\n}",
    },
  },
  'resource-read-boundary': {
    context: {
      en: 'A resource owns a cancellable read, while the save command remains an explicit user action.',
      ru: 'Resource управляет отменяемым чтением, а сохранение остаётся явной пользовательской командой.',
      es: 'Resource gestiona una lectura cancelable y el guardado permanece como comando explícito del usuario.',
    },
    files: {
      ts: "readonly userId = input.required<string>();\nreadonly user = resource({\n  params: () => this.userId(),\n  loader: ({ params, abortSignal }) =>\n    this.api.getUser(params, { signal: abortSignal }),\n});\n\nsave(changes: UserChanges) {\n  return this.api.updateUser(this.userId(), changes);\n}",
      html: "@if (user.isLoading()) {\n  <app-user-skeleton />\n} @else if (user.hasValue()) {\n  <app-user-form [user]=\"user.value()\" (save)=\"save($event)\" />\n}",
    },
  },
  'control-flow-track': {
    context: {
      en: 'Stable domain identity keeps each row component attached to the same user during reordering.',
      ru: 'Стабильный доменный ID сохраняет связь строки с тем же пользователем при сортировке.',
      es: 'Una identidad estable mantiene cada fila asociada al mismo usuario durante una reordenación.',
    },
    files: {
      html: "@for (user of users(); track user.id) {\n  <user-row [user]=\"user\" />\n} @empty {\n  <p>No users found.</p>\n}",
    },
  },
  'share-replay-cache': {
    context: {
      en: 'The cache policy is explicit: unsubscribe upstream when unused and reset the replay buffer when no subscribers remain.',
      ru: 'Политика кэша явная: отключаться от upstream и сбрасывать replay-буфер без подписчиков.',
      es: 'La política de caché es explícita: desconectar upstream y reiniciar el buffer cuando no queden suscriptores.',
    },
    files: {
      ts: "readonly users$ = this.route.params.pipe(\n  switchMap(({ teamId }) => this.api.getUsers(teamId)),\n  shareReplay({ bufferSize: 1, refCount: true }),\n);",
    },
  },
  'effect-derived-state': {
    context: {
      en: 'Pure derived state stays read-only and cannot drift away from its source signals.',
      ru: 'Чистое производное состояние остаётся read-only и не может разойтись с исходными signals.',
      es: 'El estado derivado puro permanece de solo lectura y no puede divergir de sus signals de origen.',
    },
    files: {
      ts: "readonly firstName = signal('Ada');\nreadonly lastName = signal('Lovelace');\nreadonly fullName = computed(\n  () => (this.firstName() + ' ' + this.lastName()).trim(),\n);",
    },
  },
  'flattening-operator-decision': {
    context: {
      en: 'exhaustMap turns the no-duplicate-save product rule into observable concurrency behavior.',
      ru: 'exhaustMap превращает продуктовое правило «не дублировать сохранение» в поведение конкурентности.',
      es: 'exhaustMap convierte la regla de no duplicar guardados en comportamiento de concurrencia observable.',
    },
    files: {
      ts: "readonly saveClicks = new Subject<FormValue>();\n\nreadonly saveResult$ = this.saveClicks.pipe(\n  exhaustMap((value) => this.api.save(value)),\n);",
    },
  },
  'take-until-context': {
    context: {
      en: 'A helper receives the lifetime owner explicitly instead of assuming an injection context.',
      ru: 'Helper получает владельца времени жизни явно, не полагаясь на injection context.',
      es: 'La utilidad recibe de forma explícita el propietario del ciclo de vida en vez de asumir un injection context.',
    },
    files: {
      ts: "function connectNotifications(\n  destroyRef: DestroyRef,\n  notifications$: Observable<Notification>,\n) {\n  return notifications$.pipe(takeUntilDestroyed(destroyRef));\n}",
    },
  },
};

export const questions = legacyQuestions.map((question) => {
  const { type, topic, prompt, hint, keyPoints, answer, code: legacyCode, ...metadata } = question;
  const topicKey = topicKeys[question.id];
  const en = { type, topic, prompt, hint, keyPoints, answer };
  const translations = translatedQuestionText[question.id];
  const ru = { type: typeTranslations[type].ru, topic: topicTranslations[topicKey].ru, ...translations.ru };
  const es = { type: typeTranslations[type].es, topic: topicTranslations[topicKey].es, ...translations.es };
  return {
    ...metadata,
    topicKey,
    ...en,
    content: { en, ru, es },
    ...(exampleCatalog[question.id] ? { example: exampleCatalog[question.id] } : {}),
  };
});

const lookupTranslations = {
  'signal-inputs': {
    ru: ['Сигнальные входы', 'Для реактивных входов компонента, естественно участвующих в computed-состоянии.', 'Signal input доступен компоненту только для чтения; не копируйте его в writable-состояние без причины владения.'],
    es: ['Entradas de señal', 'Para una entrada de señal reactiva que participa de forma natural en estado computed.', 'Una signal input es de solo lectura para el componente receptor; no la dupliques en estado escribible sin motivo de propiedad.'],
  },
  'take-until-destroyed': {
    ru: ['takeUntilDestroyed()', 'Подходит, когда нужна отписка RxJS вместе с завершением Angular injection context.', 'Вне injection context передайте DestroyRef явно и сначала определите владельца stream.'],
    es: ['takeUntilDestroyed()', 'Para completar una suscripción RxJS con la vida de un injection context de Angular.', 'Fuera de un injection context, pasa DestroyRef explícitamente y decide primero quién posee el stream.'],
  },
  'linked-signal': {
    ru: ['linkedSignal()', 'Когда writable-состояние должно сбрасываться или согласовываться после изменения реактивного источника.', 'Для чистого read-only вычисления используйте computed; linkedSignal нужен, потому что результат можно менять.'],
    es: ['linkedSignal()', 'Cuando el estado escribible debe reiniciarse o reconciliarse al cambiar una fuente reactiva.', 'Usa computed para derivación pura de solo lectura; linkedSignal existe porque el resultado sigue siendo escribible.'],
  },
  resource: {
    ru: ['resource()', 'Когда реактивный запрос запускает async-чтение, а UI нужны value/loading/error в signals.', 'API предназначен для чтения; отмена делает его рискованным вариантом по умолчанию для мутаций.'],
    es: ['resource()', 'Cuando una petición reactiva dirige una lectura asíncrona y la UI necesita value/loading/error basados en signals.', 'Está diseñado para lecturas; la cancelación lo hace arriesgado por defecto para mutaciones.'],
  },
  zoneless: {
    ru: ['Zoneless change detection', 'Для отказа от широкого async-patching и перехода к явным уведомлениям об изменениях.', 'Удалить ZoneJS недостаточно: интеграции, меняющие обычные поля, всё равно должны уведомить Angular.'],
    es: ['Detección de cambios zoneless', 'Para reducir el parcheo asíncrono global y avanzar hacia notificaciones explícitas.', 'No basta con quitar ZoneJS: las integraciones que mutan campos normales aún deben notificar a Angular.'],
  },
  defer: {
    ru: ['@defer', 'Для отложенной загрузки standalone-зависимостей по interaction, viewport, idle, timer или condition.', 'Плохой placeholder или trigger над fold может вызвать layout shift; вложенные блоки — каскадные загрузки.'],
    es: ['@defer', 'Para diferir dependencias standalone hasta un trigger de interacción, viewport, idle, timer o condición.', 'Un placeholder pobre o un trigger above-the-fold puede causar layout shift; bloques anidados pueden encadenar cargas.'],
  },
  'switch-map': {
    ru: ['switchMap', 'Когда новое значение source делает предыдущий inner-result неактуальным, обычно для чтений и typeahead.', 'Отмена опасна для записи, которая обязана завершиться; оператор выбирают по продуктовой семантике.'],
    es: ['switchMap', 'Cuando un nuevo valor de origen vuelve irrelevante el resultado interno anterior, normalmente en lecturas y typeahead.', 'Cancelar es peligroso para escrituras que deben completar; elige por semántica de producto.'],
  },
  'signal-store': {
    ru: ['NgRx Signal Store', 'Когда feature нужна структурированная композиция signal-state без обязательного перехода в global Store.', 'Абстракция store не исправляет неясное владение или лишнее глобальное состояние.'],
    es: ['NgRx Signal Store', 'Cuando una feature necesita composición estructurada de estado con signals sin entrar necesariamente en Store global.', 'Una abstracción store no corrige propiedad poco clara ni estado global innecesario.'],
  },
};

export const lookupEntries = legacyLookupEntries.map((entry) => {
  const { title, useWhen, typical, trap, ...metadata } = entry;
  const en = { title, useWhen, typical, trap };
  const translated = lookupTranslations[entry.id];
  const ru = { title: translated.ru[0], useWhen: translated.ru[1], typical, trap: translated.ru[2] };
  const es = { title: translated.es[0], useWhen: translated.es[1], typical, trap: translated.es[2] };
  return { ...metadata, ...en, content: { en, ru, es } };
});

const sectionTranslations = {
  warmup: {
    ru: ['Разминка', 'Три коротких вопроса, чтобы включить Angular-мышление.'],
    es: ['Calentamiento', 'Tres preguntas breves para activar tu vocabulario de Angular.'],
  },
  modern: {
    ru: ['Современный Angular', 'Концепции Angular 18–22, компромиссы и контекст миграции.'],
    es: ['Angular moderno', 'Conceptos de Angular 18–22, compromisos y contexto de migración.'],
  },
  code: {
    ru: ['Задача с кодом', 'Ревью, отладка, прогноз и рефакторинг реалистичных фрагментов.'],
    es: ['Reto de código', 'Revisa, depura, predice y refactoriza fragmentos realistas.'],
  },
  rxjs: {
    ru: ['RxJS / NgRx', 'Семантика операторов, границы состояния и сценарии отказа.'],
    es: ['RxJS / NgRx', 'Semántica de operadores, límites de estado y modos de fallo.'],
  },
  scenario: {
    ru: ['Сценарий для senior', 'Один архитектурный вопрос без единственного идеального ответа.'],
    es: ['Escenario senior', 'Una pregunta de arquitectura sin una única respuesta perfecta.'],
  },
};

export const sectionMeta = Object.fromEntries(Object.entries(legacySectionMeta).map(([key, meta]) => {
  const en = { label: meta.label, description: meta.description };
  const ru = { label: sectionTranslations[key].ru[0], description: sectionTranslations[key].ru[1] };
  const es = { label: sectionTranslations[key].es[0], description: sectionTranslations[key].es[1] };
  return [key, { eyebrow: meta.eyebrow, ...en, content: { en, ru, es } }];
}));
