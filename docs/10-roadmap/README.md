# 10 - Roadmap

## Delivery Philosophy

- Ship in thin vertical slices
- Prioritize reliability before breadth
- Instrument everything needed for decision-making

## Phase Plan

### Phase 0 - Foundation (Current)
- Monorepo scaffolding
- Product + architecture documentation
- CI/CD skeleton
- data model and API contracts

### Phase 1 - Core Platform
- Auth, workspace management, settings
- Source upload and ingestion pipeline
- Basic chat over retrieved context
- Search baseline

### Phase 2 - Knowledge Workflows
- Notes
- AI summaries
- Meeting transcript ingestion
- Timeline memory view

### Phase 3 - Study Workflows
- Flashcard generation + review loop
- Quiz generation + attempts and scoring

### Phase 4 - Commercial Readiness
- Billing integration and plan enforcement
- Admin dashboard
- advanced observability and cost controls

### Phase 5 - Optimization
- retrieval quality tuning
- memory quality tuning
- cost/latency optimization

## Milestones and Exit Criteria

Each phase requires:
- functional completion vs PRD scope
- performance targets (latency + error rate)
- test coverage and observability checklist
- rollout plan and rollback plan

`TODO`: Add calendar dates and team ownership once staffing plan is finalized.

## Risks by Phase

- ingestion complexity and queue reliability
- AI quality drift across model versions
- cost growth from naive prompt/context sizing
- schema migrations under production load

## Cross References

- PRD priorities: `../01-prd/README.md`
- Deployment runbooks: `../11-deployment/README.md`


## Long-Term Product Vision by Version

### Version 2
- Chrome extension
- Meeting recording
- Browser capture
- Advanced research tools

### Version 3
- Desktop overlay
- Native macOS app
- Native Windows app
- Voice assistant

### Version 4
- Mobile applications
- Team workspaces
- Enterprise features
- AI agents
