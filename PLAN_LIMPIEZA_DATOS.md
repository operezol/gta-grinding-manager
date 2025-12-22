# Plan de Limpieza y Población de Datos

## 🎯 OBJETIVOS

1. **Eliminar duplicados** - Muchas actividades aparecen 2 veces (dataset + legacy)
2. **Popular datos faltantes** - Actividades con "📊 No data" necesitan métricas reales
3. **Limpiar actividades inútiles** - Remover entradas que no son actividades de grinding

---

## 📋 PASO 1: ANALIZAR DUPLICADOS

### Ejecutar análisis
```bash
node scripts/analyze-duplicates.js
```

**Qué hace**:
- Identifica actividades con nombres idénticos o similares
- Muestra cuál tiene datos, sesiones, source
- Recomienda estrategia de merge

**Output esperado**:
```
Total activities: 298
Duplicate groups: ~40-50

Ejemplo:
📋 "Cayo Perico (Solo)" (2 entries):
  - ID: cayo_perico_solo (source: dataset, sessions: 0)
  - ID: cayo-perico-solo-legacy (source: legacy, sessions: 5)
```

---

## 📋 PASO 2: DEDUPLICAR

### Ejecutar deduplicación
```bash
node scripts/deduplicate-activities.js
```

**Estrategia del script**:
1. **Prioridad de conservación**:
   - Dataset con datos > Dataset sin datos > Legacy con sesiones > Legacy sin sesiones
   
2. **Merge inteligente**:
   - Mantiene la actividad con mayor prioridad
   - Migra sesiones/stats de duplicados a la conservada
   - Borra duplicados después de migrar datos
   
3. **Preserva TODO**:
   - Sessions
   - Stats (suma totales)
   - Cooldowns
   - Resupply
   - Production state
   - Sell sessions
   - Safe collections

**Output esperado**:
```
Duplicate groups processed: 45
Activities kept: 45
Activities deleted: 45-50
Total activities after: ~250
```

---

## 📋 PASO 3: LIMPIAR ACTIVIDADES INÚTILES

### Identificar actividades no-grinding

Actividades a eliminar (no son grinding activities):
- **Adversary Modes**: Air Quota, Beast vs Slasher, Bombushka Run, etc.
- **Arena War**: Carnage, Wreck It, Tag Team, etc.
- **Heist Preps solos**: Setup: Avenger, Heist Prep: Akula, etc.
- **Lugares/NPCs**: Martin Madrazo, Union Depository, Fleeca Job (lugar), etc.
- **Meta entries**: Missions in GTA Online/Soundtracks, Random Events, etc.

### Script de limpieza
```bash
node scripts/cleanup-non-grinding.js
```

**Categorías a eliminar**:
1. Adversary modes (ya están en denylist)
2. Arena War modes
3. Heist prep missions individuales (no el heist completo)
4. Entity entries (lugares, NPCs, vehículos)
5. Meta/category pages

**Resultado esperado**: ~100-150 actividades finales útiles

---

## 📋 PASO 4: POPULAR DATOS FALTANTES

### 4.1 Identificar actividades sin datos
```bash
node scripts/list-missing-data.js
```

Output: Lista de actividades con `avg_payout = NULL` o `avg_time_minutes = NULL`

### 4.2 Workflow de población

**Opción A: Manual (Recomendado para datos verificados)**

1. Editar `data.json` con datos reales:
   ```json
   {
     "id": "cayo_perico_solo",
     "name": "Cayo Perico (Solo)",
     "category": "heist",
     "solo": true,
     "passive": false,
     "payout": 1500000,        // ← AÑADIR
     "time_minutes": 60,        // ← AÑADIR
     "cooldown_minutes": 144    // ← AÑADIR
   }
   ```

2. Re-importar:
   ```bash
   node scripts/import-dataset.js
   ```

**Opción B: Desde tus sesiones reales**

Si ya has jugado actividades, usar stats reales:
```bash
node scripts/populate-from-sessions.js
```

Este script:
- Busca actividades con sesiones pero sin métricas en dataset
- Calcula avg_payout y avg_time_minutes de tus sesiones
- Actualiza `data.json` con tus promedios
- Marca con `source: 'manual'` para distinguir de datos oficiales

**Opción C: Semi-automático desde wiki**

Para actividades bien documentadas:
```bash
node scripts/fetch-wiki-metrics.js --activity "Cayo Perico"
```

---

## 📋 PASO 5: VERIFICACIÓN FINAL

### Ejecutar tests
```bash
node scripts/verify-data-quality.js
```

**Checks**:
- ✅ No duplicados
- ✅ Todas las actividades tienen id, name, category
- ✅ Actividades con sesiones tienen métricas (o se marcan para revisión)
- ✅ No hay actividades de adversary/arena/heist-prep
- ✅ Source está marcado correctamente

---

## 🎯 RESULTADO ESPERADO

### Antes
- 298 actividades totales
- ~50 duplicados
- ~200 con "📊 No data"
- Muchas actividades inútiles (adversary, heist preps, etc.)

### Después
- ~100-150 actividades útiles
- 0 duplicados
- 50-80 con datos verificados
- 50-70 sin datos (pendientes de verificar)
- Base limpia y mantenible

---

## 🔄 WORKFLOW DE MANTENIMIENTO

### Al añadir nueva actividad

1. **Añadir a `data.json`**:
   ```json
   {
     "id": "nueva_actividad",
     "name": "Nueva Actividad",
     "category": "mission",
     "solo": true,
     "passive": false,
     "payout": null,  // Dejar null hasta verificar
     "time_minutes": null,
     "cooldown_minutes": null
   }
   ```

2. **Importar**:
   ```bash
   node scripts/import-dataset.js
   ```

3. **Jugar y verificar** datos reales

4. **Actualizar con datos verificados**

5. **Re-importar**

### Al actualizar métricas existentes

Simplemente edita `data.json` y re-importa. El script solo actualiza campos presentes.

---

## 📊 SCRIPTS CREADOS

| Script | Propósito | Cuándo usarlo |
|--------|-----------|---------------|
| `analyze-duplicates.js` | Identifica duplicados | Antes de deduplicar |
| `deduplicate-activities.js` | Merge duplicados | Una vez, después de análisis |
| `cleanup-non-grinding.js` | Borra adversary/arena/etc | Una vez, limpieza inicial |
| `list-missing-data.js` | Lista sin métricas | Para planning de población |
| `populate-from-sessions.js` | Usa tus stats reales | Cuando tienes sesiones jugadas |
| `verify-data-quality.js` | Valida integridad | Después de cambios |
| `import-dataset.js` | Import/update desde data.json | Cada vez que editas data.json |

---

## 🚀 EJECUCIÓN SECUENCIAL

```bash
# 1. Analizar estado actual
node scripts/analyze-duplicates.js

# 2. Deduplicar
node scripts/deduplicate-activities.js

# 3. Limpiar actividades inútiles
node scripts/cleanup-non-grinding.js

# 4. Ver qué falta popular
node scripts/list-missing-data.js

# 5. Popular desde sesiones existentes (si tienes)
node scripts/populate-from-sessions.js

# 6. Editar data.json manualmente con datos verificados
# (nano/vim/vscode data.json)

# 7. Re-importar datos actualizados
node scripts/import-dataset.js

# 8. Verificar calidad
node scripts/verify-data-quality.js

# 9. Probar en app
npm start
cd frontend && npm run dev
```

---

## ⚠️ IMPORTANTE

### Antes de ejecutar
1. **Backup de la base de datos**:
   ```bash
   cp gta_tracker.db gta_tracker.db.backup
   ```

2. Si algo sale mal:
   ```bash
   mv gta_tracker.db.backup gta_tracker.db
   ```

### Deduplicación es irreversible
- El script borra duplicados después de migrar
- Haz backup primero
- Revisa el output del análisis antes de ejecutar

### Limpieza de adversary modes
- También irreversible
- Revisa la lista antes de confirmar
- Algunas activities pueden tener sesiones tracked

---

## 📝 PRÓXIMOS PASOS DESPUÉS DE LIMPIEZA

1. **Definir prioridades de población**:
   - Top 20 actividades más rentables
   - Actividades que ya juegas
   - Heists principales

2. **Poblar progresivamente**:
   - No necesitas completar todo de una vez
   - Empieza con lo que usas
   - Ve añadiendo según necesidad

3. **Considerar community contributions**:
   - Crear template de contribución
   - Permitir que usuarios compartan métricas
   - Sistema de verificación de datos

---

*Ejecuta los scripts en orden y revisa output en cada paso antes de continuar.*
