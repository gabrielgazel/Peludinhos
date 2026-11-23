# Pendências de API do B1 no TempDB

Data: 2026-11-22 · Origem: contrato acordado em `docs/superpowers/specs/2026-11-22-b1-insumos-front-design.md` (fatia de front do B1).

## Regra geral

Toda tarefa que exigir alteração no projeto `TempDB` é anotada neste arquivo, com **contexto**, **passos**, **aceite** e **restrições**. A execução fica para o **final das tarefas deste repo**. Nesta tarefa nada é executado no `TempDB`: este arquivo é somente documentação.

Restrições válidas para todas as tarefas registradas aqui:

- nenhuma migration `0001`–`0004` é alterada — toda mudança de banco é aditiva e idempotente, concentrada na `0005`;
- nenhuma alteração em seed, backend, rotas, tags ou outras páginas fora do escopo descrito;
- documentação e mensagens de erro/interface em português;
- sem DELETE na API (o aceite pede apenas criar, editar e listar).

## Índice

### Em aberto

- [ ] **B1 — Medicamentos e produtos com API real** — itens abertos: B1 e B2; detalhes na seção `B1` abaixo.
- [ ] **B2 — Receitas, histórico e vacinação** — detalhes na seção B2 abaixo.

### Tarefas futuras (B3 em diante)

_(sem conteúdo ainda — espaço reservado para as próximas pendências de API.)_

## B1 — Medicamentos e produtos com API real

### Contexto

A tela `/painel/insumos` passou a consumir `GET /api/medications` e `GET /api/products` via `httpClient`, mantendo as seções Medicamentos e Produtos e acrescentando criação/edição para administradores. Essas rotas ainda não existem: o front já está preparado para o contrato abaixo, que depende de alteração no `TempDB`. A pendência cobre tabelas, schemas, routers, registro na aplicação, smoke test e documentação. O aceite de persistência real fica suspenso até a execução (ver "Aceite" e o checklist final).

### Colunas

As duas tabelas (`public.medications` e `public.products`) têm o mesmo formato; muda apenas o nome da chave primária.

| Coluna | Tipo / regra | Observação |
|---|---|---|
| `medication_id` / `product_id` | inteiro, chave primária | `bigserial primary key`, como em `foods` na `0004`; vira `id` no camelCase do front |
| `name` | texto, 1–120 | obrigatório; alvo do filtro `q` |
| `type` | texto, 1–60 | obrigatório |
| `quantity` | número ≥ 0 | `numeric(10,2) not null check (quantity >= 0)` |
| `unit` | texto, 1–20 | obrigatório (`unidade`: "24 cápsulas", "500 ml", …) |
| `validity` | data | opcional (`null` quando sem validade) |
| `point` | texto livre, 1–120 | obrigatório; **não** é FK para `feeding_points` |
| `notes` | texto | opcional (`observação` do roadmap; `null` quando ausente) |
| `created_at` / `updated_at` | data/hora | opcionais na resposta; `updated_at` mantido por trigger |

### Passo 1 — Migration `0005` (criar `migrations/0005_insumos.sql`)

Seguir o padrão real de `migrations/0004_operacao.sql`: tabelas com `if not exists`, `public.touch_updated_at()` (já existente na `0001`), índices com `if not exists`, `enable row level security`, policies `to authenticated` (`select` com `private.is_project_member()`; `insert`/`update`/`delete` com `private.is_project_admin()`), grants equivalentes, **nada para `anon`**, `service_role` com CRUD e `notify pgrst, 'reload schema';` no fim. Esqueleto a adaptar:

```sql
-- 0005 — Insumos (medicamentos e produtos)
-- Aditiva e idempotente; reaproveita public.touch_updated_at(),
-- private.is_project_member() e private.is_project_admin(). Nada para anon.

create table if not exists public.medications (
    medication_id bigserial primary key,
    name          text not null check (char_length(name) between 1 and 120),
    type          text not null check (char_length(type) between 1 and 60),
    quantity      numeric(10,2) not null check (quantity >= 0),
    unit          text not null check (char_length(unit) between 1 and 20),
    validity      date,
    point         text not null check (char_length(point) between 1 and 120),
    notes         text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table if not exists public.products (
    product_id bigserial primary key,
    name       text not null check (char_length(name) between 1 and 120),
    type       text not null check (char_length(type) between 1 and 60),
    quantity   numeric(10,2) not null check (quantity >= 0),
    unit       text not null check (char_length(unit) between 1 and 20),
    validity   date,
    point      text not null check (char_length(point) between 1 and 120),
    notes      text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_medications_name  on public.medications (name);
create index if not exists idx_medications_point on public.medications (point);
create index if not exists idx_products_name     on public.products (name);
create index if not exists idx_products_point    on public.products (point);

do $$ begin
    create trigger medications_touch_updated_at
        before update on public.medications
        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
    create trigger products_touch_updated_at
        before update on public.products
        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

alter table public.medications enable row level security;
alter table public.products     enable row level security;

-- Repetir o bloco abaixo para public.products (products_* / isto é, trocar
-- medications por products e medication por product nos nomes das policies).
do $$ begin
    create policy medications_select_member on public.medications
        for select to authenticated using (private.is_project_member());
exception when duplicate_object then null; end $$;

do $$ begin
    create policy medications_insert_admin on public.medications
        for insert to authenticated with check (private.is_project_admin());
exception when duplicate_object then null; end $$;

do $$ begin
    create policy medications_update_admin on public.medications
        for update to authenticated
        using (private.is_project_admin()) with check (private.is_project_admin());
exception when duplicate_object then null; end $$;

do $$ begin
    create policy medications_delete_admin on public.medications
        for delete to authenticated using (private.is_project_admin());
exception when duplicate_object then null; end $$;

grant select on public.medications, public.products to authenticated;
grant insert, update, delete on public.medications, public.products to authenticated;
grant select, insert, update, delete on public.medications, public.products to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

notify pgrst, 'reload schema';
```

### Passo 2 — Schemas Pydantic em `app/schemas.py`

Acrescentar os seis modelos abaixo, seguindo o estilo dos schemas de domínio já existentes (`Field(min_length=…, max_length=…)`, `date`, `datetime`). Reutilizar o `Page[T]` já definido no próprio `app/schemas.py` — não criar outro. Campos opcionais com `None` onde a resposta do front espera `null` (`validity`, `notes`, `created_at`, `updated_at`); o `Update` mantém todos os campos opcionais para `model_dump(exclude_unset=True)` funcionar.

```python
class MedicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=60)
    quantity: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=20)
    validity: date | None = None
    point: str = Field(min_length=1, max_length=120)
    notes: str | None = None


class MedicationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: str | None = Field(default=None, min_length=1, max_length=60)
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    validity: date | None = None
    point: str | None = Field(default=None, min_length=1, max_length=120)
    notes: str | None = None


class MedicationOut(BaseModel):
    medication_id: int
    name: str
    type: str
    quantity: float
    unit: str
    validity: date | None = None
    point: str
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=60)
    quantity: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=20)
    validity: date | None = None
    point: str = Field(min_length=1, max_length=120)
    notes: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: str | None = Field(default=None, min_length=1, max_length=60)
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=20)
    validity: date | None = None
    point: str | None = Field(default=None, min_length=1, max_length=120)
    notes: str | None = None


class ProductOut(BaseModel):
    product_id: int
    name: str
    type: str
    quantity: float
    unit: str
    validity: date | None = None
    point: str
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
```

As listagens devem responder `Page[MedicationOut]` e `Page[ProductOut]` (`items`, `total`, `limit`, `offset`). No front, `map*` converte `snake_case` → `camelCase`: `medication_id`/`product_id` → `id`, `created_at` → `createdAt`, `updated_at` → `updatedAt`.

### Passo 3 — Routers `app/routers/medications.py` e `app/routers/products.py`

Espelhar `app/routers/foods.py`:

- `router = APIRouter(prefix="/api/medications", tags=["medications"])` e `router = APIRouter(prefix="/api/products", tags=["products"])`.
- `GET ""` → `Page[...]`, `response_model=Page[MedicationOut]` / `Page[ProductOut]`, com `_member: CurrentUser = Depends(require_member)`, filtros `q: str | None`, `limit: int = Query(default=50, ge=1, le=200)` e `offset: int = Query(default=0, ge=0)`. Usar `get_service_client()`, `service.table("medications").select("*", count="exact")`, `.ilike("name", f"%{q.strip()}%")` quando `q` não vazio, `.order("created_at", desc=True).limit(limit).offset(offset)` e devolver `Page(items=..., total=resp.count or len(items), limit=limit, offset=offset)`.
- `POST ""` → `status_code=status.HTTP_201_CREATED`, `admin: CurrentUser = Depends(require_admin)`, gravar via `get_service_client()` e devolver a linha criada (`.insert(...).select().single().execute().data`). Se `admin.member_id is None`, `403` com `detail="Perfil de membro não encontrado"`.
- `PATCH "/{id}"` → `response_model=...Out`, `_admin: CurrentUser = Depends(require_admin)`, chamar `_find_medication(service, id)` / `_find_product(service, id)` antes e depois do `update`; aplicar `payload.model_dump(exclude_unset=True)` quando não vazio.
- `_find_medication` / `_find_product`: `service.table(...).select("*").eq("medication_id"|"product_id", id).limit(1).execute().data`; se vazio, `HTTPException(status_code=404, detail="Medicamento não encontrado")` / `"Produto não encontrado"`.
- Todas as mensagens de erro em português; leitura para membros, escrita só para administração. **Não registrar rota DELETE.**

### Passo 4 — Registro dos routers em `app/main.py`

Ampliar a importação existente e incluir os dois routers junto dos demais:

```python
from app.routers import (
    adoption_intents, animals, auth, events, feeding_points, foods,
    members, medications, products, shifts,
)
...
app.include_router(medications.router)
app.include_router(products.router)
```

### Passo 5 — Smoke test em `scripts/smoke_test.py`

Inserir um bloco `[11] Insumos (B1)` antes do bloco atual `[11] Sessão` (renumerar este para `[12]`), reaproveitando `check(name, condição, detail)`, `admin_headers`, `bol_headers`, a variável `tag` e o padrão de JSON com nome sufixado para não colidir entre execuções. Cobertura mínima:

1. `POST /api/medications` sem token → `401` (anon);
2. `POST /api/medications` com `bol_headers` → `403` (bolsista não escreve); idem para `products`;
3. `POST /api/medications` com `admin_headers` → `201`, guardando `medication_id` (admin escreve);
4. `POST /api/products` com `admin_headers` → `201`, guardando `product_id`;
5. `GET /api/medications` e `GET /api/products` com `bol_headers` → `200` e `Page` com `items` (leitura de membro);
6. `PATCH /api/medications/{id}` e `PATCH /api/products/{id}` com `admin_headers` → `200`;
7. nova listagem após o `PATCH` → o nome criado e o campo editado aparecem refletidos (persistência da criação + edição);
8. `PATCH /api/medications/999999` e `PATCH /api/products/999999`, ambos com `admin_headers` e `json={}` → `404`, com `detail` "Medicamento não encontrado" / "Produto não encontrado" (cai em `_find_medication` / `_find_product`). O corpo vazio é necessário: os PATCH exigem um payload `Update`, e sem `json={}` o FastAPI responderia `422` na validação antes de chegar ao `_find_*`. O contrato define apenas `GET ""`, `POST ""` e `PATCH "/{id}"`.

Esqueleto ilustrativo (o mesmo padrão se repete para `products`):

```python
r = client.post("/api/medications", headers=admin_headers,
                json={"name": f"Medicamento Demo {tag}", "type": "analgésico",
                      "quantity": 20, "unit": "comprimidos", "point": "Canil"})
check("admin cria medicamento -> 201", r.status_code == 201, f"{r.status_code} {r.text}")
medication_id = r.json().get("medication_id") if r.status_code == 201 else None

r = client.patch(f"/api/medications/{medication_id}", headers=admin_headers,
                 json={"quantity": 12, "notes": "Ajuste de estoque"})
check("admin edita medicamento -> 200", r.status_code == 200, f"{r.status_code} {r.text}")

r = client.get("/api/medications", headers=bol_headers,
               params={"q": f"Medicamento Demo {tag}"})
item = next((i for i in r.json().get("items", []) if i.get("medication_id") == medication_id), None)
check("criação + patch refletidos na nova listagem",
      r.status_code == 200 and item is not None
      and item.get("quantity") == 12 and item.get("notes") == "Ajuste de estoque",
      f"{r.status_code} {r.text[:200]}")
```

### Passo 6 — Documentação

Atualizar `TempDB/DOCUMENTACAO.md` (no projeto `TempDB`, quando a API for executada):

- árvore de `app/routers/` com `medications.py` e `products.py`, e `migrations/` com `0005_insumos.sql`;
- item de migrations: aplicar em ordem `0001` → `0002` → `0003` → `0004` → `0005`; atualizar "Estado do modelo" de 12 para 14 tabelas;
- nova seção de endpoints (§4.3) com `GET/POST /api/medications`, `PATCH /api/medications/{id}`, `GET/POST /api/products`, `PATCH /api/products/{id}` — leitura membro, escrita administração, filtros `q`/`limit`/`offset`;
- matriz RBAC (§5): linha para "Ler insumos" ✅ membro e "Cadastrar/editar insumos" ✅ só administração;
- modelos de dados (§6): incluir `medications` e `products` com as colunas da tabela acima;
- registrar a migration `0005` como aplicada e o `notify pgrst, 'reload schema';` no fim dela.

**Seed opcional de insumos para o ensaio:** acrescentar algumas linhas de `medications`/`products` a `scripts/seed_demo.py` (rotuladas `[seed-demo]`, com nome como chave natural, sem apagar registros — padrão atual do seed) para popular a tela na demonstração. É opcional: `scripts/test_seed_demo.py` (8 testes, sem banco) e a segunda execução de `seed_demo.py` devem continuar idempotentes.

### Desvios registrados

- `point` é **texto livre** (1–120), não FK para `feeding_points`: a feature de insumos fica autocontida, sem `<select>` nem segundo service; não há integridade referencial nem padronização do nome do ponto.
- `unit` (`unidade`) é **campo adicional** em relação ao modelo antigo, necessário para representar "24 cápsulas", "500 ml", etc.
- `notes` representa a **"observação"** exigida pelo roadmap e ausente nas fixtures antigas; é campo adicional em relação ao modelo antigo.

  Tanto `unidade` quanto `observação` (`notes`) são desvios explícitos face ao modelo antigo (`Modelo DB.pdf`), do mesmo modo que a inclusão de `food_movements` foi registrada como acréscimo ao modelo na documentação do `TempDB`.

- **Sem DELETE:** a policy `delete` de administração existe na `0005` por paridade com a `0004` (defesa em profundidade), mas nenhuma rota DELETE é exposta — o aceite pede só criar, editar e listar.

### Aceite

- Criar, editar e listar medicamentos e produtos **persistem após reload** da tela e após nova listagem na API; **esse ponto só pode ser verificado depois que o usuário executar a API** (ver checklist final).
- Banner de demonstração removido da tela de insumos: pendência de aceite registrada conforme o roadmap. A fatia atual de front **não remove o componente `DemoBanner`**, que continua em uso pela prévia do termo; nenhuma alteração de código desse componente é feita aqui.

## Antes de executar (checklist)

- [ ] Confirmar a branch do `TempDB` em que a API será implementada (trabalhar no projeto `TempDB`, não neste repo de front).
- [ ] Aplicar `migrations/0005_insumos.sql` via Supabase MCP (`apply_migration`) ou, com `DATABASE_URL` válido no `.env`, via `.venv\Scripts\python.exe scripts\apply_migration.py 0005_insumos.sql` (executa em uma transação).
- [ ] Confirmar que a migration termina com `notify pgrst, 'reload schema';` e que o schema cache recarregou (novos endpoints aparecem em `http://127.0.0.1:8000/docs`).
- [ ] Subir a API (`.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000`) e rodar `.venv\Scripts\python.exe scripts\smoke_test.py` — incluído o bloco de insumos com RBAC negativo (anon 401, bolsista 403) e a checagem de criação + patch refletidos.
- [ ] Rodar `.venv\Scripts\python.exe scripts\test_seed_demo.py` e, se o seed opcional de insumos for adotado, `scripts\seed_demo.py` (idempotente).
- [ ] **Persistir após reload: verificação final, pendente.** Só pode ser confirmada depois que o usuário executar os passos acima; até lá o aceite fica suspenso e não deve ser marcado como concluído nesta fatia.

## B2 — Receitas, histórico e vacinação

### Contexto

Data: 2026-11-23 · Origem: desenho da fatia de frente do B2 em `docs/superpowers/specs/2026-11-23-b2-saude-animal-front-design.md`.

A ficha do animal no painel ganhou a aba **Saúde**, com histórico veterinário, vacinação e receitas. O front já está preparado para o contrato abaixo (tipos, services e página), mas as rotas, tabelas e schemas ainda não existem. Como no B1, **nada é executado no projeto `TempDB` nesta fatia**: este arquivo é somente documentação; a execução fica para o final das tarefas deste repo.

Valem as mesmas restrições do B1, válidas para todas as tarefas registradas aqui:

- nenhuma migration `0001`–`0004` é alterada — toda mudança de banco é aditiva e idempotente, concentrada na `0006`;
- nenhuma alteração em seed, backend, rotas, tags ou outras páginas fora do escopo descrito;
- documentação e mensagens de erro/interface em português;
- sem DELETE na API (o aceite pede apenas registrar, editar e visualizar).

### Colunas

As três tabelas usam a mesma estrutura de autoria e auditoria; muda o nome da chave primária e os campos do domínio.

#### `public.veterinary_history` — histórico veterinário

| Coluna | Tipo / regra | Observação |
|---|---|---|
| `history_id` | inteiro, chave primária | `bigserial primary key`; vira `id` no camelCase do front |
| `animal_id` | inteiro, FK | referência a `public.animals (animal_id)`; vira `animalId` |
| `record_date` | data | obrigatório (`date`); vira `recordDate` |
| `title` | texto, 1–120 | obrigatório; alvo do filtro `q` |
| `description` | texto | obrigatório |
| `created_by_member_id` | inteiro, FK | referência a `public.members (member_id)`; autor da edição; vira `createdByMemberId` |
| `created_at` / `updated_at` | data/hora | opcionais na resposta; `updated_at` mantido por trigger |

#### `public.vaccination_history` — vacinação

| Coluna | Tipo / regra | Observação |
|---|---|---|
| `vaccination_id` | inteiro, chave primária | `bigserial primary key`; vira `id` no camelCase do front |
| `animal_id` | inteiro, FK | referência a `public.animals (animal_id)`; vira `animalId` |
| `vaccine` | texto, 1–120 | obrigatório; alvo do filtro `q` |
| `application_date` | data | obrigatório (`date`); vira `applicationDate` |
| `dose` | texto, 1–40 | opcional (`null` quando ausente) |
| `notes` | texto | opcional (`null` quando ausente) |
| `created_by_member_id` | inteiro, FK | referência a `public.members (member_id)`; autor da edição; vira `createdByMemberId` |
| `created_at` / `updated_at` | data/hora | opcionais na resposta; `updated_at` mantido por trigger |

#### `public.veterinary_prescription` — receitas

| Coluna | Tipo / regra | Observação |
|---|---|---|
| `prescription_id` | inteiro, chave primária | `bigserial primary key`; vira `id` no camelCase do front |
| `animal_id` | inteiro, FK | referência a `public.animals (animal_id)`; vira `animalId` |
| `medication` | texto livre, 1–120 | obrigatório; **não** é FK para `medications`; alvo do filtro `q` |
| `dosage` | texto, 1–240 | obrigatório (posologia); vira `dosage` |
| `prescription_date` | data | obrigatório (`date`); vira `prescriptionDate` |
| `notes` | texto | opcional (`null` quando ausente) |
| `created_by_member_id` | inteiro, FK | referência a `public.members (member_id)`; autor da edição; vira `createdByMemberId` |
| `created_at` / `updated_at` | data/hora | opcionais na resposta; `updated_at` mantido por trigger |

**Observação explícita:** `medication` é **texto livre (1–120), não FK para `medications`**, porque a API de medicamentos do B1 ainda não existe. Isso evita acoplamento entre fatias e a necessidade de um `<select>` com segunda service no front. O contrato poderá migrar para FK quando as duas APIs existirem.

### Passo 1 — Migration `0006` (criar `migrations/0006_saude_animal.sql`)

Seguir o padrão da `0005`: tabelas com `if not exists`, `public.touch_updated_at()` (já existente na `0001`), índices com `if not exists` em `animal_id` e nas datas do domínio, `enable row level security`, policies `to authenticated` (`select` com `private.is_project_member()`; `insert` com `private.is_project_member()`; `update` com checagem de autor **ou** `private.is_project_admin()`), grants equivalentes, **nada para `anon`**, `service_role` com CRUD e `notify pgrst, 'reload schema';` no fim. Não criar policy nem grant de `delete` para `authenticated`. Esqueleto a adaptar:

```sql
-- 0006 — Saúde do animal (histórico, vacinação e receitas)
-- Aditiva e idempotente; reaproveita public.touch_updated_at(),
-- private.is_project_member() e private.is_project_admin(). Nada para anon.
-- A autoridade de escrita é o router (get_service_client contorna RLS);
-- as policies abaixo são apenas defesa adicional.

create table if not exists public.veterinary_history (
    history_id           bigserial primary key,
    animal_id            bigint not null references public.animals (animal_id),
    record_date          date not null,
    title                text not null check (char_length(title) between 1 and 120),
    description          text not null,
    created_by_member_id bigint not null references public.members (member_id),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create table if not exists public.vaccination_history (
    vaccination_id       bigserial primary key,
    animal_id            bigint not null references public.animals (animal_id),
    vaccine              text not null check (char_length(vaccine) between 1 and 120),
    application_date     date not null,
    dose                 text check (char_length(dose) between 1 and 40),
    notes                text,
    created_by_member_id bigint not null references public.members (member_id),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create table if not exists public.veterinary_prescription (
    prescription_id      bigserial primary key,
    animal_id            bigint not null references public.animals (animal_id),
    medication           text not null check (char_length(medication) between 1 and 120),
    dosage               text not null check (char_length(dosage) between 1 and 240),
    prescription_date    date not null,
    notes                text,
    created_by_member_id bigint not null references public.members (member_id),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create index if not exists idx_veterinary_history_animal on public.veterinary_history (animal_id);
create index if not exists idx_veterinary_history_date   on public.veterinary_history (record_date desc, history_id desc);
create index if not exists idx_vaccination_history_animal on public.vaccination_history (animal_id);
create index if not exists idx_vaccination_history_date   on public.vaccination_history (application_date desc, vaccination_id desc);
create index if not exists idx_veterinary_prescription_animal on public.veterinary_prescription (animal_id);
create index if not exists idx_veterinary_prescription_date   on public.veterinary_prescription (prescription_date desc, prescription_id desc);

do $$ begin
    create trigger veterinary_history_touch_updated_at
        before update on public.veterinary_history
        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
    create trigger vaccination_history_touch_updated_at
        before update on public.vaccination_history
        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
    create trigger veterinary_prescription_touch_updated_at
        before update on public.veterinary_prescription
        for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

alter table public.veterinary_history       enable row level security;
alter table public.vaccination_history      enable row level security;
alter table public.veterinary_prescription  enable row level security;

-- Repetir o bloco abaixo para vaccination_history e veterinary_prescription,
-- trocando o nome da tabela e da policy. private.current_member_id()
-- representa o vínculo de membro da sessão; adaptar ao helper existente
-- no TempDB (no router, a comparação é com o member_id do usuário atual).
do $$ begin
    create policy veterinary_history_select_member on public.veterinary_history
        for select to authenticated using (private.is_project_member());
exception when duplicate_object then null; end $$;

do $$ begin
    create policy veterinary_history_insert_member on public.veterinary_history
        for insert to authenticated with check (private.is_project_member());
exception when duplicate_object then null; end $$;

do $$ begin
    create policy veterinary_history_update_author_or_admin on public.veterinary_history
        for update to authenticated
        using (
            created_by_member_id = private.current_member_id()
            or private.is_project_admin()
        )
        with check (
            created_by_member_id = private.current_member_id()
            or private.is_project_admin()
        );
exception when duplicate_object then null; end $$;

grant select on public.veterinary_history, public.vaccination_history, public.veterinary_prescription to authenticated;
grant insert, update on public.veterinary_history, public.vaccination_history, public.veterinary_prescription to authenticated;
grant select, insert, update, delete on public.veterinary_history, public.vaccination_history, public.veterinary_prescription to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

notify pgrst, 'reload schema';
```

RLS é **defesa adicional**: os routers usam `get_service_client()` (cliente `service_role`), que contorna as policies. A autoridade da regra de autoria é a checagem no router; por isso o smoke test cobre explicitamente o caso negativo.

### Passo 2 — Schemas Pydantic em `app/schemas.py`

Acrescentar os nove modelos abaixo, seguindo o estilo dos schemas de domínio já existentes (`Field(min_length=…, max_length=…)`, `date`, `datetime`). Reutilizar o `Page[T]` já definido no próprio `app/schemas.py` — não criar outro. Campos opcionais com `| None = None` onde a resposta do front espera `null` (`dose`, `notes`, `created_at`, `updated_at`); o `Update` mantém **todos** os campos opcionais para `model_dump(exclude_unset=True)` funcionar. O router deve ignorar tentativas de alterar `created_by_member_id` no `PATCH`.

```python
class VeterinaryHistoryCreate(BaseModel):
    animal_id: int
    record_date: date
    title: str = Field(min_length=1, max_length=120)
    description: str
    created_by_member_id: int


class VeterinaryHistoryUpdate(BaseModel):
    record_date: date | None = None
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    created_by_member_id: int | None = None


class VeterinaryHistoryOut(BaseModel):
    history_id: int
    animal_id: int
    record_date: date
    title: str
    description: str
    created_by_member_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class VaccinationCreate(BaseModel):
    animal_id: int
    vaccine: str = Field(min_length=1, max_length=120)
    application_date: date
    dose: str | None = Field(default=None, min_length=1, max_length=40)
    notes: str | None = None
    created_by_member_id: int


class VaccinationUpdate(BaseModel):
    vaccine: str | None = Field(default=None, min_length=1, max_length=120)
    application_date: date | None = None
    dose: str | None = Field(default=None, min_length=1, max_length=40)
    notes: str | None = None
    created_by_member_id: int | None = None


class VaccinationOut(BaseModel):
    vaccination_id: int
    animal_id: int
    vaccine: str
    application_date: date
    dose: str | None = None
    notes: str | None = None
    created_by_member_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PrescriptionCreate(BaseModel):
    animal_id: int
    medication: str = Field(min_length=1, max_length=120)
    dosage: str = Field(min_length=1, max_length=240)
    prescription_date: date
    notes: str | None = None
    created_by_member_id: int


class PrescriptionUpdate(BaseModel):
    medication: str | None = Field(default=None, min_length=1, max_length=120)
    dosage: str | None = Field(default=None, min_length=1, max_length=240)
    prescription_date: date | None = None
    notes: str | None = None
    created_by_member_id: int | None = None


class PrescriptionOut(BaseModel):
    prescription_id: int
    animal_id: int
    medication: str
    dosage: str
    prescription_date: date
    notes: str | None = None
    created_by_member_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
```

As listagens devem responder `Page[VeterinaryHistoryOut]`, `Page[VaccinationOut]` e `Page[PrescriptionOut]` (`items`, `total`, `limit`, `offset`). No front, as funções `map*` convertem `snake_case` → `camelCase`: `history_id`/`vaccination_id`/`prescription_id` → `id`, `created_at` → `createdAt`, `updated_at` → `updatedAt`, e `record_date`/`application_date`/`prescription_date` → `recordDate`/`applicationDate`/`prescriptionDate`.

### Passo 3 — Routers

Criar três routers espelhando `app/routers/foods.py` e a autoridade de autoria descrita no desenho do B2:

- `app/routers/veterinary_history.py` com `router = APIRouter(prefix="/api/animals/{animal_id}/veterinary-history", tags=["veterinary-history"])`;
- `app/routers/vaccinations.py` com `router = APIRouter(prefix="/api/animals/{animal_id}/vaccinations", tags=["vaccinations"])`;
- `app/routers/prescriptions.py` com `router = APIRouter(prefix="/api/animals/{animal_id}/prescriptions", tags=["prescriptions"])`.

Leitura e criação (caminho aninhado):

- `GET ""` → `response_model=Page[...Out]`, com `_member: CurrentUser = Depends(require_member)`; filtros `q: str | None`, `limit: int = Query(default=50, ge=1, le=200)` e `offset: int = Query(default=0, ge=0)`. Usar `get_service_client()`, `.select("*", count="exact")`, `.eq("animal_id", animal_id)`, `.ilike` no campo do domínio quando `q` não vazio, `.order("record_date" | "application_date" | "prescription_date", desc=True)` com desempate `.order("<pk>", desc=True)`, `.limit(limit).offset(offset)` e devolver `Page(items=..., total=resp.count or len(items), limit=limit, offset=offset)`.
- `POST ""` → `status_code=status.HTTP_201_CREATED`, `member: CurrentUser = Depends(require_member)`, gravar via `get_service_client()` e devolver a linha criada (`.insert(...).select().single().execute().data`). Exigir que `created_by_member_id` seja igual ao `member_id` da sessão; se `member.member_id is None`, `403` com `detail="Perfil de membro não encontrado"`. Qualquer membro da equipe pode criar.

Edição (recurso pelo id, sem o prefixo do animal):

- `PATCH /api/veterinary-history/{id}`, `PATCH /api/vaccinations/{id}` e `PATCH /api/prescriptions/{id}` → `response_model=...Out`, `member: CurrentUser = Depends(require_member)` **mais** checagem no router: autor (`created_by_member_id == member.member_id`) ou `private.is_project_admin()`. Quando não houver permissão, `403` com `detail="Você não tem permissão para editar este registro."`.
- Chamar o `_find_*` antes e depois do `update`; aplicar `payload.model_dump(exclude_unset=True)` quando não vazio; nunca aceitar alteração de `created_by_member_id` vinda do corpo.
- `_find_*`: `service.table(...).select("*").eq("history_id" | "vaccination_id" | "prescription_id", id).limit(1).execute().data`; se vazio, `404` com `detail="Registro não encontrado."` (histórico), `"Vacina não encontrada."` (vacinação) ou `"Receita não encontrada."` (receitas).
- Ordenação: data do domínio em ordem decrescente, desempate por id decrescente — o front não reordena.
- Todas as mensagens de erro em português. **Não registrar rota DELETE** em nenhum dos três routers.

### Passo 4 — Registro dos routers e documentação

Ampliar a importação existente em `app/main.py` e incluir os três routers junto dos demais:

```python
from app.routers import (
    adoption_intents, animals, auth, events, feeding_points, foods,
    members, medications, products, shifts,
    prescriptions, vaccinations, veterinary_history,
)
...
app.include_router(veterinary_history.router)
app.include_router(vaccinations.router)
app.include_router(prescriptions.router)
```

Atualizar `TempDB/DOCUMENTACAO.md` (no projeto `TempDB`, quando a API for executada):

- árvore de `app/routers/` com `veterinary_history.py`, `vaccinations.py` e `prescriptions.py`, e `migrations/` com `0006_saude_animal.sql`;
- item de migrations: aplicar em ordem `0001` → `0002` → `0003` → `0004` → `0005` → `0006`; atualizar "Estado do modelo" de 14 para 17 tabelas;
- nova seção de endpoints com `GET/POST /api/animals/{id}/veterinary-history`, `/vaccinations`, `/prescriptions` e `PATCH /api/veterinary-history/{id}`, `/api/vaccinations/{id}`, `/api/prescriptions/{id}` — leitura e criação para membros, edição somente para autor ou administração, filtros `q`/`limit`/`offset`, sem DELETE;
- matriz RBAC (§5): linhas para "Ler dados clínicos" ✅ membro, "Registrar dado clínico" ✅ membro e "Editar dado clínico" ✅ apenas autor ou administração;
- modelos de dados (§6): incluir `veterinary_history`, `vaccination_history` e `veterinary_prescription` com as colunas das tabelas acima;
- registrar a migration `0006` como aplicada e o `notify pgrst, 'reload schema';` no fim dela.

### Passo 5 — Smoke test em `scripts/smoke_test.py`

Inserir um bloco `[12] Saúde do animal (B2)` (renumerando o bloco atual `[12] Sessão`, se necessário), reaproveitando `check(name, condição, detail)`, `admin_headers`, `bol_headers`, a variável `tag` e o padrão de JSON com nome sufixado para não colidir entre execuções. Cobertura mínima:

1. anon sem token → `401` nas três rotas de leitura/escrita;
2. bolsista (`bol_headers`) → `403` ao tentar `PATCH` de registro de **outro autor** (RBAC negativo);
3. autor → `200` no `PATCH` do próprio registro;
4. administração (`admin_headers`) → `200` no `PATCH` de qualquer registro;
5. membro → `200` na leitura das três listagens com `items` de `Page`;
6. criação + `PATCH` refletidos em nova listagem (persistência da criação e da edição);
7. `404` em id inexistente, com `detail` "Registro não encontrado." / "Vacina não encontrada." / "Receita não encontrada." (enviar `json={}` para não cair no `422` de validação do `Update`);
8. nenhuma rota DELETE exposta (as três coleções e os recursos por id não respondem a `DELETE`).

Esqueleto ilustrativo (o mesmo padrão se repete para as três entidades):

```python
r = client.post(f"/api/animals/{animal_id}/veterinary-history", headers=bol_headers,
                json={"record_date": "2026-11-23", "title": f"Consulta Demo {tag}",
                      "description": "Check-up", "created_by_member_id": bol_member_id})
check("membro cria histórico -> 201", r.status_code == 201, f"{r.status_code} {r.text}")
history_id = r.json().get("history_id") if r.status_code == 201 else None

r = client.patch(f"/api/veterinary-history/{history_id}", headers=admin_headers,
                 json={"description": "Ajuste admin"})
check("admin edita histórico de outro autor -> 200", r.status_code == 200, f"{r.status_code} {r.text}")

r = client.get(f"/api/animals/{animal_id}/veterinary-history", headers=bol_headers,
               params={"q": f"Consulta Demo {tag}"})
item = next((i for i in r.json().get("items", []) if i.get("history_id") == history_id), None)
check("criação + patch refletidos na nova listagem",
      r.status_code == 200 and item is not None
      and item.get("description") == "Ajuste admin",
      f"{r.status_code} {r.text[:200]}")
```

### Desvios registrados

- `medication` é **texto livre (1–120), não FK** para `medications`: a API do B1 ainda não existe; evita acoplamento entre fatias e um `<select>` com segunda service no front.
- **Sem DELETE:** nenhuma rota DELETE é exposta e nenhum botão de exclusão aparece na tela — o aceite pede só registrar, editar e visualizar.
- **Autor ausente:** registro sem `created_by_member_id` é exibido no front como "—", nunca atribuído a um membro arbitrário.
- **RLS não é a autoridade:** os routers usam `get_service_client()`, que contorna as policies; a checagem de autor no router é a autoridade final e o RLS é apenas defesa adicional.

### Antes de executar (B2)

Espelhando o checklist do B1, com os comandos já prontos para o projeto `TempDB`:

- [ ] Confirmar a branch do `TempDB` em que a API será implementada (trabalhar no projeto `TempDB`, não neste repo de front).
- [ ] Aplicar `migrations/0006_saude_animal.sql` via Supabase MCP (`apply_migration`) ou, com `DATABASE_URL` válido no `.env`, via `.venv\Scripts\python.exe scripts\apply_migration.py 0006_saude_animal.sql` (executa em uma transação).
- [ ] Confirmar que a migration termina com `notify pgrst, 'reload schema';` e que o schema cache recarregou (novos endpoints aparecem em `http://127.0.0.1:8000/docs`).
- [ ] Subir a API (`.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000`) e rodar `.venv\Scripts\python.exe scripts\smoke_test.py` — incluído o bloco `[12] Saúde do animal (B2)` com anon 401, bolsista 403 em PATCH de registro de outro autor, autor 200 no próprio registro, admin 200 em qualquer registro, leitura de membro, criação + PATCH refletidos, 404 em id inexistente e nenhuma rota DELETE exposta.
- [ ] Rodar `.venv\Scripts\python.exe scripts\test_seed_demo.py`.
- [ ] **Persistir após reload: verificação final, pendente.** Só pode ser confirmada depois que o usuário executar os passos acima; até lá o aceite fica suspenso e não deve ser marcado como concluído nesta fatia.

### Aceite suspenso

Registrar vacina e receita, recarregar e ver os dados na ficha do animal **só pode ser verificado depois que a API do B2 for executada** no `TempDB` (ver checklist "Antes de executar (B2)"). A fatia atual de front **não marca `B2` como concluído no roadmap**: o item permanece `- [ ]` até a execução e a verificação da persistência real.
