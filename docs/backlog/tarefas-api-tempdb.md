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

- [ ] **B1 — Medicamentos e produtos com API real** — único item aberto; detalhes na seção `B1` abaixo.

### Tarefas futuras (B2 em diante)

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


# Espelhar exatamente para products, trocando Medication por Product
# e medication_id por product_id:
# ProductCreate / ProductUpdate / ProductOut
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
