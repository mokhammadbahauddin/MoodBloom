# MoodBloom

A wellness-tracker web application built for university students to manage their physical and mental health.

## Language

**SyncService**:
An independent service observing state via `store.subscribe()` outside the React render cycle to manage syncing lifecycle (debouncing, batching).
_Avoid_: FirebaseSync, SyncHook, SyncComponent

**CloudStorageAdapter**:
An interface that the `SyncService` depends on to push and pull data, allowing for different implementations (like `FirebaseStorageAdapter` or `InMemoryStorageAdapter`). Provides generic collection subscriptions and batch writes.
_Avoid_: DatabaseConnection, FirebaseInstance

**SyncOperation**:
A generic data structure representing a write or delete action, passed from the `SyncService` to the `CloudStorageAdapter`.
_Avoid_: FirebaseBatch, DBQuery

**MergeStrategy**:
A collection-specific set of rules inside `SyncService` used to resolve conflicts between local state and incoming remote data (e.g., LWW for tasks, array-merging for steps).
_Avoid_: GlobalResolver, ConflictHandler

**CustomLLMAdapter**:
A server-side routing adapter in `server.ts` that formats and forwards prompts to an OpenAI-compatible self-hosted AI model (e.g., Ollama or custom local server) using configuration environment variables.
_Avoid_: OllamaClient, CustomClient

**LocalFallbackEngine**:
The local offline heuristic engine (`heuristicInsightEngine.ts`) that runs wellness assessment algorithms and sentiment rules on-device when remote AI adapters are offline or disabled.
_Avoid_: LocalAI, OfflineHeuristics

**LocalRuleCoach**:
An offline, client-side rule-based conversational agent (`localRuleCoach.ts`) that evaluates the user's message keywords in combination with their daily health metrics to generate tailored, context-aware coaching advice and actionable wellness recommendations.
_Avoid_: StaticFAQ, ClientLLM, OfflineChatbot

